import { Controller, Post, Body } from '@nestjs/common';
import { CreatePushNotificationDto } from './dto/create-push-notification.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('push-notifications')
export class PushNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createPushNotificationDto: CreatePushNotificationDto) {
    return this.notificationsService.notifyUser({
      recipientId: createPushNotificationDto.recipientId,
      title: createPushNotificationDto.title,
      message: createPushNotificationDto.message,
      relatedEntity: createPushNotificationDto.relatedEntity,
      type: createPushNotificationDto.type,
    });
  }
}
