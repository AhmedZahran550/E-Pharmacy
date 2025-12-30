import { forwardRef, Module } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestMessagesService } from './service-request-messages.service';
import { ServiceRequestsController } from './service-requests.controller';
import { DoctorServiceRequestsController } from './doctor-service-requests.controller';
import { ServiceRequestsSseController } from './service-requests-sse.controller';
import { StorageService } from '@/common/storage.service';
import { ServiceRequestsSseService } from './service-requests-sse.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';
import { ItemsModule } from '../items/items.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    forwardRef(() => OrdersModule),
    NotificationsModule,
    PushNotificationsModule,
    forwardRef(() => ItemsModule),
  ],
  controllers: [
    ServiceRequestsController,
    DoctorServiceRequestsController,
    ServiceRequestsSseController,
  ],
  providers: [
    ServiceRequestsService,
    ServiceRequestMessagesService,
    StorageService,
    ServiceRequestsSseService,
  ],
  exports: [
    ServiceRequestsService,
    ServiceRequestsSseService,
    ServiceRequestMessagesService,
  ],
})
export class ServiceRequestsModule {}
