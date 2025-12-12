import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { EmployeesModule } from '../employees/employees.module';
import { BranchesModule } from '../branches/branches.module';
import { SharedModule } from '@/common/shared.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    forwardRef(() => UsersModule),
    NotificationsModule,
    EmployeesModule,
    BranchesModule,
    SharedModule,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
