import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ServiceRequestMessage,
  MessageType,
  SenderRole,
} from '@/database/entities/service-request-message.entity';
import { ServiceRequest } from '@/database/entities/service-request.entity';
import { CreateServiceRequestMessageDto } from './dto/create-service-request-message.dto';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { StorageService } from '@/common/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ServiceRequestsSseService } from './service-requests-sse.service';
import { LocalizationService } from '@/i18n/localization.service';
import {
  NotificationPriority,
  NotificationType,
  RelatedEntityType,
  SystemNotificationType,
} from '../notifications/dto/notification.enum';
import { NotificationChannel } from '@/database/entities/system-notification.entity';
import { DeviceToken } from '@/database/entities/device-token.entity';
import { In } from 'typeorm';

@Injectable()
export class ServiceRequestMessagesService {
  constructor(
    @InjectRepository(ServiceRequestMessage)
    private messageRepository: Repository<ServiceRequestMessage>,
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    private storageService: StorageService,
    private notificationsService: NotificationsService,
    private sseService: ServiceRequestsSseService,
    private readonly i18n: LocalizationService,
  ) {}

  async createMessage(
    requestId: string,
    sender: AuthUserDto,
    dto: CreateServiceRequestMessageDto,
    files: Express.Multer.File[] = [],
    role: SenderRole,
  ) {
    const request = await this.serviceRequestRepository.findOneOrFail({
      where: { id: requestId },
      relations: ['user', 'doctor'],
    });
    // Validation: Check if sender is part of the request
    if (role === SenderRole.USER && request.userId !== sender.id) {
      throw new BadRequestException('You are not the owner of this request');
    }
    if (role === SenderRole.DOCTOR) {
      // For doctor, check if assigned
      if (request.doctorId !== sender.id) {
        throw new BadRequestException('You are not assigned to this request');
      }
    }

    let imageUrl: string | undefined;
    let documentUrl: string | undefined;
    let fileName: string | undefined;

    // Handle File Uploads (Basic logic, assuming single file mostly or first file matters for type)
    if (files && files.length > 0) {
      const file = files[0];
      const uploaded = await this.storageService.saveFile(
        file,
        `service-requests/${requestId}/messages/${Date.now()}-${file.originalname}`,
        'chat-attachments',
      );

      if (file.mimetype.startsWith('image/')) {
        imageUrl = uploaded.url;
        dto.type = MessageType.IMAGE;
      } else {
        documentUrl = uploaded.url;
        fileName = file.originalname;
        dto.type = MessageType.DOCUMENT;
      }
    }

    const message = this.messageRepository.create({
      requestId,
      content: dto.content,
      type: dto.type,
      senderRole: role,
      senderUserId: role === SenderRole.USER ? sender.id : null,
      senderDoctorId: role === SenderRole.DOCTOR ? sender.id : null,
      messageMetadata: {
        imageUrl,
        documentUrl,
        fileName,
      },
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Notify the other party
    this.notifyNewMessage(request, savedMessage, role);

    return savedMessage;
  }

  private async notifyNewMessage(
    request: ServiceRequest,
    message: ServiceRequestMessage,
    senderRole: SenderRole,
  ) {
    // 1. SSE Notification
    this.sseService.notifyServiceRequestUpdate(
      request.id,
      message,
      'new_message',
    );

    // 2. Push/System Notification
    if (senderRole === SenderRole.USER) {
      // Notify Doctor
      if (request.doctorId) {
        await this.notificationsService.createSystemNotification({
          title: this.i18n.translate('notifications.NEW_MESSAGE.title'),
          message: this.i18n.translate('notifications.NEW_MESSAGE.body', {
            args: {
              senderName: `${request.user.firstName} ${request.user.lastName}`,
            },
          }),
          type: SystemNotificationType.NEW_MESSAGE,
          data: { serviceRequestId: request.id, messageId: message.id },
          priority: NotificationPriority.HIGH,
          channel: NotificationChannel.PROVIDER_PORTAL,
          isRead: false,
          // Explicitly link to the doctor employee
          recipientId: request.doctorId,
        } as any);
      }
    } else {
      // Notify User
      await this.notificationsService.createAppNotification({
        title: this.i18n.translate('notifications.NEW_MESSAGE.title'),
        message: this.i18n.translate('notifications.NEW_MESSAGE.body', {
          args: { senderName: 'Doctor' }, // Or specific doctor name
        }),
        type: NotificationType.NEW_MESSAGE,
        recipient: { id: request.userId },
        data: { serviceRequestId: request.id, messageId: message.id },
        relatedEntity: {
          type: RelatedEntityType.SERVICE_REQUEST,
          id: request.id,
        },
        isRead: false,
      });
    }
  }
}
