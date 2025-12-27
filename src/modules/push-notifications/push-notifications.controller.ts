import { Controller, Post, Body } from '@nestjs/common';
import { CreatePushNotificationDto } from './dto/create-push-notification.dto';
import { PushNotificationsService } from './push-notifications.service';

@Controller('push-notifications')
export class PushNotificationsController {
  constructor(
    private readonly notificationsService: PushNotificationsService,
  ) {}

  @Post()
  create(@Body() createPushNotificationDto: CreatePushNotificationDto) {
    return this.notificationsService.sendPushNotification(
      createPushNotificationDto.tokens,
      createPushNotificationDto.title,
      createPushNotificationDto.body,
      createPushNotificationDto.data,
    );
  }
}
