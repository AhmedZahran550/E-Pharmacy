import { Injectable } from '@nestjs/common';
import { AppNotificationService } from './app-notification.service';
import { SystemNotificationsService } from './system-notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CreateSystemNotificationsDto } from './dto/create-notification.dto'; // Assuming same DTO or similar interface
import { EntityManager } from 'typeorm';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly appNotificationService: AppNotificationService,
    private readonly systemNotificationsService: SystemNotificationsService,
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  // Delegate to AppNotificationService
  async createAppNotification(
    createDto: CreateNotificationDto,
    options?: { manager?: EntityManager },
  ) {
    return this.appNotificationService.create(createDto, options);
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

  // Expose underlying services if needed
  get app() {
    return this.appNotificationService;
  }

  get system() {
    return this.systemNotificationsService;
  }
}
