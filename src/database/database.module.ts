import { City } from '@/database/entities/city.entity';
import { Governorate } from '@/database/entities/governorate.entity';
import { Otp } from '@/database/entities/otp.entity';
import { User } from '@/database/entities/user.entity';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchItem } from './entities/branch-item.entity';
import { Branch } from './entities/branch.entity';
import { Employee } from './entities/employee.entity';
import { Item } from './entities/item.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { Notification } from './entities/notification.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { OrderHistory } from './entities/order-history.entity';
import { Provider } from './entities/provider.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { DeviceToken } from './entities/device-token.entity';
import { SystemNotification } from './entities/system-notification.entity';
import { BranchRating } from './entities/branch-rating.entity';
import { MedicineSchedule } from './entities/medicine-schedule.entity';
import { ServiceRequest } from './entities/service-request.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        timezone: 'z',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Employee,
      Otp,
      Provider,
      Branch,
      BranchItem,
      BranchRating,
      Item,
      Order,
      OrderItem,
      OrderHistory,
      Notification,
      SystemNotification,
      ActivityLog,
      City,
      Governorate,
      PasswordResetToken,
      DeviceToken,
      MedicineSchedule,
      ServiceRequest,
    ]),
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
