import { Order } from '@/database/entities/order.entity';
import { OrderAction } from '@/modules/orders/dto/order-action.dto';
import { EntityManager, QueryRunner } from 'typeorm';

export interface OrderStatusNotification {
  queryRunner?: QueryRunner;
  order: Order;
  action?: OrderAction;
  reason?: string;
}
