import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { DecimalColumn } from '../decimal-column.decorator';
import { Item } from './item.entity';

import { User } from './user.entity';

@Entity({ name: 'order_item' })
@Index('ORDER_ITEM_ORDER_IDX', ['order'])
@Index('ORDER_ITEM_ITEM_IDX', ['item'])
@Index('ORDER_ITEM_USER_IDX', ['user'])
export class OrderItem extends BaseEntity<OrderItem> {
  @ManyToOne(() => Order, (order) => order.orderItems, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  order: Order;

  @ManyToOne(() => Item)
  @JoinColumn()
  item: Item;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  notes: string;

  @DecimalColumn()
  unitPrice: number;

  @DecimalColumn()
  totalPrice: number;
}
