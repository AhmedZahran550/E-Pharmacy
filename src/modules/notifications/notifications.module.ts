import { forwardRef, Global, Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { UserNotificationsController } from './recipient-notifications.controller';
import { LocalizationModule } from '@/i18n/localization.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { OrdersModule } from '../orders/orders.module';

@Global()
@Module({
  controllers: [NotificationsController, UserNotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
  imports: [
    LocalizationModule,
    PushNotificationsModule,
    forwardRef(() => OrdersModule),
  ],
})
export class NotificationsModule {}
