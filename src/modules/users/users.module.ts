import { forwardRef, Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { CustomersModule } from '../customers/customers.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  providers: [UsersService, ProfileService],
  exports: [UsersService, ProfileService],
  controllers: [ProfileController, UsersController],
  imports: [CustomersModule, forwardRef(() => OrdersModule)],
})
export class UsersModule {}
