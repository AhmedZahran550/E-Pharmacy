import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { DecimalColumn } from '../decimal-column.decorator';
import { Item } from './item.entity';
import { Extras } from './cart-item.entity';
import { User } from './user.entity';

const ORDER_PROVIDER_ITEM_UNIQUE_IDX = 'ORDER_PROVIDER_ITEM_UNIQUE_IDX';

@Entity({ name: 'order_item' })
@Index('ORDER_ITEM_ORDER_IDX', ['order'])
@Check(
  `("item_id" IS NOT NULL AND "user_id" IS NULL) OR ("item_id" IS NULL AND "user_id" IS NOT NULL)`,
)
export class OrderItem extends BaseEntity<OrderItem> {
  @ManyToOne(() => Order, (order) => order.orderItems, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  order: Order;

  @ManyToOne(() => Item, {
    nullable: true,
  })
  @JoinColumn()
  item: Item;

  @ManyToOne(() => User, {
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' }) // This specifies the foreign key column
  user: User;

  @Column({ name: 'user_id', nullable: true, type: 'uuid' }) // This is the key change
  userId: string;

  @Column()
  quantity: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  extras?: Extras;

  @DecimalColumn()
  unitPrice: number;

  @DecimalColumn({ select: false, nullable: true })
  settlementPrice: number;

  @DecimalColumn()
  totalPrice: number;
}
