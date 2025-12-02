import { Column, Entity, Index } from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { BaseEntity } from './base.entity';

export enum NavigationType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

@Entity({ name: 'advertisement' })
@Index('ADVERTISEMENT_DATE_RANGE_IDX', ['startDate', 'endDate'])
export class Advertisement extends BaseEntity {
  @Column({ nullable: true })
  description: string;

  @DateColumn()
  startDate: Date;

  @DateColumn()
  endDate: Date;

  @Column()
  imageUrl: string;

  @Column()
  link: string;

  @Column({
    type: 'enum',
    enum: NavigationType,
    default: NavigationType.INTERNAL,
  })
  navigationType: NavigationType;

  @Column({ default: true })
  isActive: boolean;
}
