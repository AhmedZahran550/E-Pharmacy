import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Item } from './item.entity';
import { Consultation } from './consultation.entity';
import { DateColumn } from '@/common/decorators/date-column.decorator';

export enum FrequencyType {
  ONCE_DAILY = 'ONCE_DAILY',
  TWICE_DAILY = 'TWICE_DAILY',
  THREE_TIMES_DAILY = 'THREE_TIMES_DAILY',
  FOUR_TIMES_DAILY = 'FOUR_TIMES_DAILY',
  EVERY_X_HOURS = 'EVERY_X_HOURS',
  AS_NEEDED = 'AS_NEEDED',
  CUSTOM = 'CUSTOM',
}

@Entity('medication_schedules')
export class MedicationSchedule extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  medicationName: string; // Item name at time of schedule creation

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'enum', enum: FrequencyType })
  frequency: FrequencyType;

  @Column({ type: 'int', nullable: true })
  frequencyValue: number; // For EVERY_X_HOURS

  @Column({ type: 'jsonb', nullable: true })
  times: string[]; // Array of times like ["08:00", "14:00", "20:00"]

  @DateColumn()
  startDate: Date;

  @DateColumn({ nullable: true })
  endDate: Date;

  @Column({ type: 'int', nullable: true })
  durationDays: number;

  @Column({ type: 'boolean', default: true })
  reminderEnabled: boolean;

  @Column({ type: 'int', default: 15 })
  reminderMinutesBefore: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relationships
  @ManyToOne(() => User, (user) => user.medicationSchedules)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Item, { nullable: true })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ type: 'uuid', nullable: true })
  itemId: string;

  @ManyToOne(
    () => Consultation,
    (consultation) => consultation.medicationSchedules,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'consultation_id' })
  consultation: Consultation;

  @Column({ type: 'uuid', nullable: true })
  consultationId: string;
}
