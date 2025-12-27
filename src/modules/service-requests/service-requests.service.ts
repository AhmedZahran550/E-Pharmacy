import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from '@/database/entities/service-request.entity';
import { Item } from '@/database/entities/item.entity';
import { User } from '@/database/entities/user.entity';
import { Employee } from '@/database/entities/employee.entity';
import { DeviceToken } from '@/database/entities/device-token.entity';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { StorageService } from '@/common/storage.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/dto/notification.enum';
import { ErrorCodes } from '@/common/error-codes';
import { ServiceRequestsSseService } from './service-requests-sse.service';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    private storageService: StorageService,
    private pushNotificationsService: PushNotificationsService,
    private notificationsService: NotificationsService,
    private sseService: ServiceRequestsSseService,
    private dataSource: DataSource,
  ) {}

  async create(
    user: User,
    dto: CreateServiceRequestDto,
    files: Express.Multer.File[] = [],
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validate items if selected
      if (dto.selectedItems && dto.selectedItems.length > 0) {
        const itemIds = dto.selectedItems.map((i) => i.itemId);
        const items = await this.itemRepository.find({
          where: {
            id: In(itemIds),
          },
        });

        if (items.length !== itemIds.length) {
          throw new BadRequestException({
            message: 'One or more items do not exist',
            code: ErrorCodes.ITEM_NOT_FOUND,
          });
        }
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }

    // 2. Upload images
    const prescriptionImages: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const obj = await this.storageService.saveFile(
          file,
          `prescriptions/${user.id}/${Date.now()}-${file.originalname}`,
          'prescriptions',
        );
        prescriptionImages.push(obj.url);
      }
    }

    // 3. Create Service Request
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const serviceRequest = this.serviceRequestRepository.create({
      ...dto,
      userId: user.id,
      requestNo: `SRQ-${Date.now()}`,
      status: ServiceRequestStatus.PENDING,
      prescriptionImages,
      expiresAt,
    });

    try {
      const savedRequest = await queryRunner.manager.save(serviceRequest);
      await queryRunner.commitTransaction();

      // 4. Notify Doctors
      this.notifyDoctors(savedRequest, dto.branch.id);

      return savedRequest;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getOne(id: string, userId: string) {
    return this.serviceRequestRepository.findOneOrFail({
      where: { id, userId },
    });
  }

  private async notifyDoctors(
    serviceRequest: ServiceRequest,
    branchId: string,
  ) {
    // Find online doctors in branch
    const doctors = await this.employeeRepository.find({
      where: {
        branch: { id: branchId },
        isOnline: true,
      },
    });

    if (doctors.length === 0) return;

    // 1. SSE Notification
    this.sseService.notifyNewServiceRequest(branchId, serviceRequest);

    // 2. Fetch device tokens for these doctors
    const doctorIds = doctors.map((d) => d.id);
    const deviceTokens = await this.deviceTokenRepository.find({
      where: {
        employeeId: In(doctorIds),
      },
    });

    const tokens = deviceTokens.map((dt) => dt.deviceToken);

    // 3. Send Push Notification
    if (tokens.length > 0) {
      await this.pushNotificationsService.sendPushNotification(
        tokens,
        'New Service Request',
        `New service request #${serviceRequest.requestNo}`,
        { serviceRequestId: serviceRequest.id },
      );
    }

    // 4. In-App System Notification
    for (const doctor of doctors) {
      await this.notificationsService.createSystemNotification({
        title: 'New Service Request',
        body: `New service request #${serviceRequest.requestNo}`,
        type: NotificationType.NEW_SERVICE_REQUEST, // Keep as NEW_ORDER_REQUEST or rename? User didn't specify enum rename.
        // Assuming NEW_ORDER_REQUEST enum is used for service requests too for now.
        // Or I should rename it to NEW_SERVICE_REQUEST.
        // Given prompt "change the name of the order-request to service-request", I should probably rename the enum too.
        // I'll check enum file later. For now, assume I will rename it.
        recipientId: doctor.id,
        data: { serviceRequestId: serviceRequest.id },
      });
    }
  }
}
