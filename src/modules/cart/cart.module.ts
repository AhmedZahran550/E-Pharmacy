import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartController } from './cart.controller';
import { ItemsModule } from '../items/items.module';
import { OrdersModule } from '../orders/orders.module';
import { ProviderCartController } from './provider.cart.controller';
import { CustomerCartController } from './customer-carts.controller';
import { AdminUserCartsController } from './admin-user-carts.controller';

@Module({
  controllers: [
    CartController,
    ProviderCartController,
    CustomerCartController,
    AdminUserCartsController,
  ],
  providers: [CartsService],
  imports: [ItemsModule, OrdersModule],
  exports: [CartsService],
})
export class CartModule {}
