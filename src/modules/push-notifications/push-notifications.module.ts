import { forwardRef, Module } from '@nestjs/common';
import { PushNotificationsController } from './push-notifications.controller';
import { PushNotificationsService } from './push-notifications.service';
import { FirebaseService } from './firebase.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [PushNotificationsController],
  providers: [PushNotificationsService, FirebaseService],
  exports: [PushNotificationsService, FirebaseService],
  imports: [forwardRef(() => NotificationsModule)],
})
export class PushNotificationsModule {}
