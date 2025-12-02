import { forwardRef, Module } from '@nestjs/common';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from '@/common/pushNotifications.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [PushNotificationsController],
  providers: [PushNotificationsService],
  exports: [PushNotificationsService],
  imports: [forwardRef(() => NotificationsModule)],
})
export class PushNotificationsModule {}
