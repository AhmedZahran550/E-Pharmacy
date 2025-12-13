import { forwardRef, Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UserNotificationsController } from './recipient-notifications.controller';
import { LocalizationModule } from '@/i18n/localization.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { OrdersModule } from '../orders/orders.module';

import { SystemNotificationsService } from './system-notification.service';
import { AppNotificationService } from './app-notification.service';

@Global()
@Module({
  controllers: [NotificationsController, UserNotificationsController],
  providers: [
    NotificationsService,
    SystemNotificationsService,
    AppNotificationService,
  ],
  exports: [
    NotificationsService,
    SystemNotificationsService,
    AppNotificationService,
  ],
  imports: [
    LocalizationModule,
    PushNotificationsModule,
    forwardRef(() => OrdersModule),
  ],
})
export class NotificationsModule {}
