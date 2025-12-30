import { Injectable, Logger } from '@nestjs/common';
import { AppNotificationService } from './app-notification.service';
import { SystemNotificationsService } from './system-notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateSystemNotificationsDto } from './dto/create-notification.dto'; // Assuming same DTO or similar interface
import { DataSource, EntityManager } from 'typeorm';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { LocalizationService } from '@/i18n/localization.service';
import { User } from '@/database/entities/user.entity';
import { Notification } from '@/database/entities/notification.entity';
import { SystemNotification } from '@/database/entities/system-notification.entity';
import { Employee } from '@/database/entities/employee.entity';

@Injectable()
export class NotificationsService {
  protected readonly logger = new Logger(AppNotificationService.name);
  constructor(
    private readonly appNotificationService: AppNotificationService,
    private readonly systemNotificationsService: SystemNotificationsService,
    private dataSource: DataSource,
    private readonly i18n: LocalizationService,
    private pushNotificationsService: PushNotificationsService,
  ) {}

  // Delegate to AppNotificationService
  async createNotification(
    createDto: CreateNotificationDto,
    options?: { manager?: EntityManager },
  ) {
    const notification = await this.appNotificationService.create(
      createDto,
      options,
    );
    // Send push notification asynchronously (don't block notification creation)
    this.sendPushNotification(notification).catch((error) => {
      this.logger.error(
        `Failed to send push notification for notification ${notification.id}`,
        error.stack,
      );
    });
    return notification;
  }

  // Delegate to SystemNotificationsService
  async createSystemNotification(
    createDto: any & { pushTokens?: string[]; data?: Record<string, unknown> },
    options?: { manager?: EntityManager },
  ) {
    const notification = await this.systemNotificationsService.create(
      createDto,
      options,
    );

    if (createDto.pushTokens && createDto.pushTokens.length > 0) {
      await this.pushNotificationsService.sendPushNotification(
        createDto.pushTokens,
        createDto.title,
        createDto.message,
        createDto.data,
      );
    }
    return notification;
  }

  private async sendPushNotification(
    notification: Notification,
  ): Promise<void> {
    try {
      let recipient: User | Employee;
      // Fetch user with device tokens and preferences
      if (notification.user) {
        recipient = await this.dataSource.getRepository(User).findOne({
          where: { id: notification.user.id as string },
          relations: ['deviceTokens'],
          select: {
            id: true,
            preferences: true,
            notificationsEnabled: true,
            deviceTokens: {
              id: true,
              deviceToken: true,
            },
          },
        });
      } else if (notification.employee) {
        recipient = await this.dataSource.getRepository(Employee).findOne({
          where: { id: notification.employee.id as string },
          relations: ['deviceTokens'],
          select: {
            id: true,
            deviceTokens: {
              id: true,
              deviceToken: true,
            },
          },
        });
      }

      if (
        recipient instanceof User &&
        (!recipient.preferences?.pushNotificationsEnabled ||
          !recipient.notificationsEnabled)
      ) {
        this.logger.debug(
          `Push notifications disabled for user ${recipient.id}`,
        );
        return;
      }

      // Extract device tokens
      const tokens = recipient.deviceTokens?.map((dt) => dt.deviceToken) || [];

      if (tokens.length === 0) {
        this.logger.debug(`No device tokens found for user ${recipient.id}`);
        return;
      }

      // Prepare notification data
      const notificationData: Record<string, unknown> = {
        notificationId: notification.id,
        type: notification.type,
      };

      // Add related entity data if exists
      if (notification.relatedEntity) {
        notificationData.relatedEntityType = notification.relatedEntity.type;
        notificationData.relatedEntityId = notification.relatedEntity.id;
        if (notification.relatedEntity.orderNo) {
          notificationData.orderNo = notification.relatedEntity.orderNo;
        }
        if (notification.relatedEntity.otp) {
          notificationData.otp = notification.relatedEntity.otp;
        }
      }

      // Send push notification with localized content
      this.pushNotificationsService.sendPushNotification(
        tokens,
        notification.title,
        notification.message,
        notificationData,
      );

      this.logger.log(
        `Push notification sent for notification ${notification.id} to ${tokens.length} device(s)`,
      );
    } catch (error) {
      // Re-throw to be caught by the caller's catch block
      this.logger.error(
        `Failed to send push notification for notification ${notification.id}`,
        error.stack,
      );
    }
  }

  // Expose underlying services if needed
  get app() {
    return this.appNotificationService;
  }

  get system() {
    return this.systemNotificationsService;
  }
}
