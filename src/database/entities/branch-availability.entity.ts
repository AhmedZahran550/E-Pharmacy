import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Branch } from './branch.entity';
import { BaseEntity } from './base.entity';
import { TimeColumn } from '@/common/decorators/time-column.decorator';

export enum DayOfWeek {
  SUNDAY = 'sunday',
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
}

@Entity('branch_availability')
@Index('BRANCH_AVAILABILITY_BRANCH_DAY_IDX', ['branch', 'dayOfWeek'], {
  unique: true,
})
@Index('BRANCH_AVAILABILITY_DAY_OPEN_CLOSE_IDX', [
  'dayOfWeek',
  'openingTime',
  'closingTime',
])
export class BranchAvailability extends BaseEntity {
  @Column({
    type: 'enum',
    enum: DayOfWeek,
    nullable: false,
  })
  dayOfWeek: DayOfWeek;

  @TimeColumn()
  openingTime: string;

  @TimeColumn()
  closingTime: string;

  @Column({
    type: 'boolean',
    asExpression: `"opening_time" = '00:00' AND "closing_time" = '23:59'`,
    generatedType: 'STORED',
    update: false,
    insert: false,
  })
  is24Hours: boolean;

  @ManyToOne(() => Branch, (branch) => branch.availability, {
    onDelete: 'CASCADE',
  })
  branch: Branch;
}
