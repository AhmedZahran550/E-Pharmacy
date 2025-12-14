import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';

export enum ActorType {
  USER = 'USER',
  EMPLOYEE = 'EMPLOYEE',
  SYSTEM = 'SYSTEM',
}

export enum ChangeType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

export class OrderHistoryStatus {
  status: string;
  imageUrl: string;
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

  @Column({ type: 'enum', enum: ChangeType })
  changeType: ChangeType;

  @Column({ type: 'jsonb', nullable: true })
  from?: OrderHistoryStatus;

  @Column({ type: 'jsonb', nullable: true })
  to?: OrderHistoryStatus;
}
