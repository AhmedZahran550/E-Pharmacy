import { Module, forwardRef } from '@nestjs/common';
import { LoyaltyPointsModule } from '../loyalty-points/loyalty-points.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PromosModule } from '../promos/promos.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { ItemsOrdersService } from './items-orders.service';
import { OrderHistoryService } from './order-history.service';
import { OrderOtpService } from './order-otp.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { SubscriptionOrdersController } from './subscription-orders.controller';
import { SubscriptionOrdersService } from './subscription-orders.service';
import { UserOrdersController } from './user-orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { BranchOrdersController } from './branch-order.controller';
import { ProviderOrdersController } from './provider-order.controller';
import { CustomerOrdersController } from './customer-order.controller';
import { AdminUserOrdersController } from './admin-user-order.controller';

@Module({
  controllers: [
    OrdersController,
    SubscriptionOrdersController,
    UserOrdersController,
    AdminOrdersController,
    BranchOrdersController,
    ProviderOrdersController,
    CustomerOrdersController,
    AdminUserOrdersController,
  ],
  providers: [
    OrdersService,
    OrderHistoryService,
    ItemsOrdersService,
    SubscriptionOrdersService,
    OrderOtpService,
  ],
  imports: [
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => UsersModule),
    PromosModule,
    forwardRef(() => TransactionsModule),
    forwardRef(() => LoyaltyPointsModule),
    forwardRef(() => NotificationsModule),
  ],
  exports: [
    OrdersService,
    OrderHistoryService,
    ItemsOrdersService,
    SubscriptionOrdersService,
    OrderOtpService,
  ],
})
export class OrdersModule {}
