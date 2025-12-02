import { Check, Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { DecimalColumn } from '../decimal-column.decorator';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { OfferItem } from './offer-item.entity';
import { Provider } from './provider.entity';

export enum PricingType {
  FIXED_PRICE = 'FIXED_PRICE',
  FIXED_DISCOUNT = 'FIXED_DISCOUNT',
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
}

@Entity({ name: 'offer' })
@Index('OFFER_BRANCH_IDX', ['branch'])
@Index('OFFER_ACTIVE_DATE_IDX', ['isActive', 'startDate', 'endDate'])
@Index('OFFER_NAME_UNIQUE_IDX', ['name'], { unique: true })
@Check(`(pricing_type = 'FIXED_PRICE' AND fixed_price IS NOT NULL AND discount_percentage IS NULL AND discount_amount IS NULL)
OR (pricing_type = 'FIXED_DISCOUNT' AND discount_amount IS NOT NULL AND fixed_price IS NULL AND discount_percentage IS NULL)
OR (pricing_type = 'PERCENTAGE_DISCOUNT' AND discount_percentage IS NOT NULL AND fixed_price IS NULL AND discount_amount IS NULL)`)
export class Offer extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @DecimalColumn({ nullable: true })
  fixedPrice: number;

  @Column({ nullable: true })
  discountPercentage: number;

  @DecimalColumn({ nullable: true })
  discountAmount: number;

  @Column({
    type: 'enum',
    enum: PricingType,
  })
  pricingType: PricingType;

  @Check(`"start_date" < "end_date"`)
  @DateColumn()
  startDate: Date;

  @DateColumn()
  endDate: Date;

  @Column({ nullable: true })
  imageEn: string;

  @Column({ nullable: true })
  imageAr: string;

  @Column({ default: false })
  isActive: boolean;

  @OneToMany(() => OfferItem, (offerItem) => offerItem.offer, {
    nullable: false,
    cascade: true,
  })
  offerItems: OfferItem[];

  @ManyToOne(() => Provider, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  provider: Provider;

  @ManyToOne(() => Branch, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  branch: Branch;

  @Column({ nullable: true })
  order: number;
}
