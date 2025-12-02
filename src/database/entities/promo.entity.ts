import { Check, Column, Entity, Index } from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { PromoType } from '../../modules/promos/dto/Promo-type.model';
import { BaseEntity } from './base.entity';

@Entity({ name: 'promo' })
@Index('PROMO_DATE_RANGE_IDX', ['startDate', 'endDate'])
@Index('PROMO_CODE_IDX', ['code'], { unique: true })
export class Promo extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: PromoType,
  })
  @Index()
  type: PromoType; // Use the enum type

  @Column({ nullable: true })
  description: string;

  @Index('PROMO_START_DATE_IDX')
  @DateColumn()
  startDate: Date;

  @DateColumn()
  endDate: Date;

  @Column({ nullable: true })
  discountAmount?: number;

  @Column({ nullable: true })
  maxMembers: number;

  @Column({ default: 0 })
  usageCount: number;

  @Column({ default: true })
  isActive: boolean;
}
