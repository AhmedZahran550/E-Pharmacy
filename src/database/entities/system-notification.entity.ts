import {
  NotificationPriority,
  SystemNotificationType,
} from '@/modules/notifications/dto/notification.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { BaseEntity } from './base.entity';
import { Provider } from './provider.entity';
import { Branch } from './branch.entity';

export enum NotificationChannel {
  PROVIDER_PORTAL = 'PROVIDER_PORTAL',
  ADMIN_PORTAL = 'ADMIN_PORTAL',
}

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

  @ManyToOne(() => Provider, (provider) => provider.notifications, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  provider?: Partial<Provider>;
}
