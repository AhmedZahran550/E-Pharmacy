import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { QueryConfig } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { Notification } from '@/database/entities/notification.entity';
import { User } from '@/database/entities/user.entity';
import { LocalizationService } from '@/i18n/localization.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

export const NOTIFICAION_PAGINATION_CONFIG: QueryConfig<Notification> = {
  sortableColumns: ['metadata.createdAt'],
  filterableColumns: {
    recipient_id: [FilterOperator.EQ],
    type: [FilterOperator.EQ],
    isRead: [FilterOperator.EQ],
    'metadata.createdAt': [
      FilterOperator.GTE,
      FilterOperator.LTE,
      FilterOperator.EQ,
    ],
  },
  defaultSortBy: [['metadata.createdAt', 'DESC']],
};

@Injectable()
export class AppNotificationService extends DBService<
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto
> {
  protected readonly logger = new Logger(AppNotificationService.name);

  constructor(
    @InjectRepository(Notification)
    protected repository: Repository<Notification>,
    private dataSource: DataSource,
    private readonly i18n: LocalizationService,
    private pushNotificationsService: PushNotificationsService,
  ) {
    super(repository, NOTIFICAION_PAGINATION_CONFIG);
  }

  async create(
    createDto: CreateNotificationDto,
    options?: { manager?: EntityManager },
  ): Promise<Notification> {
    // Save notification to database first
    const notification = await super.create(createDto, options);

    // Send push notification asynchronously (don't block notification creation)
    this.sendPushNotification(notification).catch((error) => {
      this.logger.error(
        `Failed to send push notification for notification ${notification.id}`,
        error.stack,
      );
    });

    return notification;
  }

  private async sendPushNotification(
    notification: Notification,
  ): Promise<void> {
    try {
      // Fetch user with device tokens and preferences
      const user = await this.dataSource.getRepository(User).findOne({
        where: { id: notification.recipient.id as string },
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

      if (!user) {
        this.logger.warn(
          `User ${notification.recipient.id} not found for push notification`,
        );
        return;
      }

      // Check if user has notifications enabled (backward compatibility)
      const notificationsEnabled =
        user.preferences?.notificationsEnabled ??
        user.notificationsEnabled ??
        true;

      if (!notificationsEnabled) {
        this.logger.debug(`Push notifications disabled for user ${user.id}`);
        return;
      }

      // Extract device tokens
      const tokens = user.deviceTokens?.map((dt) => dt.deviceToken) || [];

      if (tokens.length === 0) {
        this.logger.debug(`No device tokens found for user ${user.id}`);
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
      await this.pushNotificationsService.sendPushNotification(
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
      throw error;
    }
  }
}
