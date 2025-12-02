import {
  NotificationPriority,
  NotificationType,
  RelatedEntityType,
} from '@/modules/notifications/dto/notification.enum';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export interface RelatedEntity {
  otp?: string;
  type: RelatedEntityType;
  id: number | string;
  orderNo?: string;
}
@Index('NOTIFICATION_RECIPIENT_IDX', ['recipient'])
@Entity({ name: 'notification' })
export class Notification extends BaseEntity {
  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @DateColumn({ nullable: true })
  sentAt: Date;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MAX,
  })
  priority: NotificationPriority;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'recipient_id' })
  recipient: Partial<User>;

  @Column({ type: 'jsonb', nullable: true })
  relatedEntity: RelatedEntity;
}
