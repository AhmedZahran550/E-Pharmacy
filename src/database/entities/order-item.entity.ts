import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { DecimalColumn } from '../decimal-column.decorator';
import { Item } from './item.entity';

@Entity({ name: 'order_item' })
@Index('ORDER_ITEM_ORDER_IDX', ['order'])
@Index('ORDER_ITEM_ITEM_IDX', ['item'])
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

  @Column()
  quantity: number;

  @Column({ nullable: true })
  notes: string;

  @DecimalColumn({ nullable: true })
  unitPrice: number;

  @DecimalColumn({ nullable: true })
  totalPrice: number;

  @Column({ type: 'text', nullable: true })
  doctorInstructions: string; // Education from doctor

  @Column({ type: 'text', nullable: true })
  medicationTiming: string; // When to take (morning, evening, etc.)

  @Column({ type: 'jsonb', nullable: true })
  schedule: {
    frequency: string; // ONCE_DAILY, TWICE_DAILY, etc.
    times: string[]; // ["08:00", "20:00"]
    duration: number; // days
    instructions: string;
  }; // Medication schedule for this item
}
