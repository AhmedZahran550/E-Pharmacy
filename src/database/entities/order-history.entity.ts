import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';

export enum ActorType {
  USER = 'USER',
  EMPLOYEE = 'EMPLOYEE',
  SYSTEM = 'SYSTEM',
}

@Entity({ name: 'order_history' })
export class OrderHistory extends BaseEntity<OrderHistory> {
  @ManyToOne(() => Order, (order) => order.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Partial<Order>;

  @Column({ type: 'enum', enum: ActorType })
  actorType: ActorType;

  @Column({ nullable: true })
  actorId?: string;

  @Column({ nullable: true })
  actorName?: string;

  @Column()
  changeType: string;

  @Column({ type: 'jsonb', nullable: true })
  previous?: any;

  @Column({ type: 'jsonb', nullable: true })
  current?: any;
}
