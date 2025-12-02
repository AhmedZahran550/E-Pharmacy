import { forwardRef, Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UserNotificationsController } from './recipient-notifications.controller';
import { SystemNotificationsService } from './system-notification.service';
import { LocalizationModule } from '@/i18n/localization.module';
import { AdminNotificationsController } from './admin-notifications.controller';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { ProviderNotificationsController } from './provider-notifications.controller';

@Global()
@Module({
  controllers: [
    NotificationsController,
    UserNotificationsController,
    AdminNotificationsController,
    ProviderNotificationsController,
  ],
  providers: [NotificationsService, SystemNotificationsService],
  exports: [NotificationsService, SystemNotificationsService],
  imports: [
    LocalizationModule,
    PushNotificationsModule,
    forwardRef(() => OrdersModule),
  ],
})
export class NotificationsModule {}
