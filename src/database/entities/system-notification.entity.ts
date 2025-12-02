import {
  NotificationChannel,
  NotificationPriority,
  SystemNotificationType,
} from '@/modules/notifications/dto/notification.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { Customer } from './customer.entity';
import { Provider } from './provider.entity';
import { Branch } from './branch.entity';
import { ClosingBill } from './closing-bill.entity';

@Index('SYSTEM-NOTIFICATION_CUSTOMER_IDX', ['customer'])
@Index('SYSTEM-NOTIFICATION_BRANCH_IDX', ['branch'])
@Index('SYSTEM-NOTIFICATION_PROVIDER_IDX', ['provider'])
@Entity({ name: 'system_notification' })
export class SystemNotification extends BaseEntity {
  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    nullable: true,
  })
  channel: NotificationChannel;

  @DateColumn({ nullable: true })
  sentAt?: Date;

  @Column({
    type: 'enum',
    enum: SystemNotificationType,
  })
  type: SystemNotificationType;

  @ManyToOne(() => Order, (order) => order.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  order?: Order;

  @ManyToOne(() => ClosingBill, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  closingBill?: ClosingBill;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MAX,
  })
  priority?: NotificationPriority;

  @ManyToOne(() => Branch, (branch) => branch.notifications, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  branch?: Partial<Branch>;

  @ManyToOne(() => Customer, (customer) => customer.notifications, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  customer?: Partial<Customer>;

  @ManyToOne(() => Provider, (provider) => provider.notifications, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  provider?: Partial<Provider>;
}
