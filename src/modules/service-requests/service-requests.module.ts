import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequest } from '@/database/entities/service-request.entity';
import { Item } from '@/database/entities/item.entity';
import { Employee } from '@/database/entities/employee.entity';
import { DeviceToken } from '@/database/entities/device-token.entity';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequestsController } from './service-requests.controller';
import { DoctorServiceRequestsController } from './doctor-service-requests.controller';
import { ServiceRequestsSseController } from './service-requests-sse.controller';
import { StorageService } from '@/common/storage.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRequest, Item, Employee, DeviceToken]),
    NotificationsModule,
    PushNotificationsModule,
  ],
  controllers: [
    ServiceRequestsController,
    DoctorServiceRequestsController,
    ServiceRequestsSseController,
  ],
  providers: [ServiceRequestsService, StorageService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
