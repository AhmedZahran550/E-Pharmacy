import { BadRequestException, Injectable } from '@nestjs/common';
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
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationPriority,
  SystemNotificationType,
} from '../notifications/dto/notification.enum';
import { ErrorCodes } from '@/common/error-codes';
import { ServiceRequestsSseService } from './service-requests-sse.service';
import { LocalizationService } from '@/i18n/localization.service';
import { NotificationChannel } from '@/database/entities/system-notification.entity';
import {
  NotificationType,
  RelatedEntityType,
} from '../notifications/dto/notification.enum';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { OrdersService } from '../orders/orders.service';

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
    private notificationsService: NotificationsService,
    private sseService: ServiceRequestsSseService,
    private ordersService: OrdersService,
    private dataSource: DataSource,
    private readonly i18n: LocalizationService,
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

  async getOneWithMedicalProfile(id: string, branchId: string) {
    const request = await this.serviceRequestRepository.findOneOrFail({
      where: { id, branchId },
      relations: ['user', 'user.medicalProfile'],
    });

    return request;
  }

  async acceptRequest(requestId: string, doctor: AuthUserDto) {
    if (!doctor.branchId) {
      throw new BadRequestException('Doctor must belong to a branch');
    }

    const request = await this.serviceRequestRepository.findOneOrFail({
      where: { id: requestId, branchId: doctor.branchId },
      relations: ['user'],
      lock: { mode: 'optimistic', version: 1 },
    });

    if (request.status !== ServiceRequestStatus.PENDING) {
      throw new BadRequestException(
        'Request is not in PENDING status and cannot be accepted',
      );
    }

    // // Check max concurrent requests (assuming 5 for now)
    // const activeRequestsCount = await this.serviceRequestRepository.count({
    //   where: {
    //     doctorId: doctor.id,
    //     status: ServiceRequestStatus.REVIEWING,
    //   },
    // });

    // const MAX_CONCURRENT_REQUESTS = 5;
    // if (activeRequestsCount >= MAX_CONCURRENT_REQUESTS) {
    //   throw new BadRequestException(
    //     'You have reached the maximum number of concurrent requests',
    //   );
    // }

    // Update Request
    request.status = ServiceRequestStatus.REVIEWING;
    request.doctor = { id: doctor.id } as any;
    request.assignedAt = new Date();

    const savedRequest = await this.serviceRequestRepository.save(request);

    // Notify User
    // 1. SSE
    this.sseService.notifyServiceRequestUpdate(
      request.id,
      {
        status: request.status,
        doctor: {
          id: doctor.id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
        },
      },
      'doctor_assigned',
    );
    this.notificationsService.createAppNotification({
      title: this.i18n.translate('notifications.DOCTOR_ASSIGNED.title', {
        args: { doctorName: `${doctor.firstName} ${doctor.lastName}` },
      }),
      message: this.i18n.translate('notifications.DOCTOR_ASSIGNED.body', {
        args: { doctorName: `${doctor.firstName} ${doctor.lastName}` },
      }),
      type: NotificationType.SERVICE_REQUEST_UPDATE,
      recipient: { id: request.userId },
      data: { serviceRequestId: request.id },
      relatedEntity: {
        type: RelatedEntityType.SERVICE_REQUEST,
        id: request.id,
      },
      isRead: false,
    });
    return savedRequest;
  }

  async createOrder(
    requestId: string,
    doctor: AuthUserDto,
    dto: CreateOrderDto,
  ) {
    const request = await this.serviceRequestRepository.findOneOrFail({
      where: {
        id: requestId,
        doctorId: doctor.id,
        status: ServiceRequestStatus.REVIEWING,
      },
      relations: ['user'],
    });
    const order = this.ordersService.createOrder(dto, request, doctor);
    return order;
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
    // 3. System Notification & Push
    await this.notificationsService.createSystemNotification({
      title: this.i18n.translate('notifications.NEW_SERVICE_REQUEST.title'),
      message: this.i18n.translate('notifications.NEW_SERVICE_REQUEST.body', {
        args: { requestNo: serviceRequest.requestNo },
      }),
      type: SystemNotificationType.NEW_SERVICE_REQUEST,
      branch: { id: branchId },
      pushTokens: tokens,
      data: { serviceRequestId: serviceRequest.id },
      priority: NotificationPriority.HIGH,
      channel: NotificationChannel.PROVIDER_PORTAL,
      isRead: false,
    } as any);
  }
}
