import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order, OrderStatus } from './order.entity';

@Entity({ name: 'order_history' })
export class OrderHistory extends BaseEntity {
  @Column({
    type: 'enum',
    enum: OrderStatus,
  })
  fromStatus: OrderStatus;

  @Column({
    type: 'enum',
    enum: OrderStatus,
  })
  toStatus: OrderStatus;

  @Column({ nullable: true })
  reason?: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn()
  order: Order;
}
