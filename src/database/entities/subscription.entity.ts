import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { BaseEntity } from './base.entity';
import { Plan } from './plan.entity';
import { User } from './user.entity';
import { Order } from './order.entity';

export enum SubscriptionStatus {
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

@Entity({ name: 'subscription' })
@Index('SUBSCRIPTION_USER_UQ_IDX', ['user'], {
  unique: true,
  where: `"status" = 'ACTIVE'`, // Define a partial index condition
})
@Index('SUBSCRIPTION_PLAN_IDX', ['plan'])
@Index('SUBSCRIPTION_USER_IDX', ['user'])
@Index('SUBSCRIPTION_DATE_RANGE_IDX', ['startDate', 'endDate'])
export class Subscription extends BaseEntity {
  @ManyToOne(() => Plan)
  @JoinColumn()
  plan: Partial<Plan>;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: Partial<User>;

  @DateColumn({ name: 'start_date' })
  startDate: Date;

  @DateColumn({ name: 'end_date' })
  endDate: Date;

  @Column({ default: false })
  autoRenewal: boolean;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.NEW,
  })
  status: SubscriptionStatus;

  @OneToMany(() => Order, (order: Order) => order.subscription)
  orders: Order[];
}
