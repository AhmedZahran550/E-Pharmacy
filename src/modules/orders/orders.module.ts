import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [forwardRef(() => UsersModule), NotificationsModule],
  exports: [OrdersService],
})
export class OrdersModule {}
