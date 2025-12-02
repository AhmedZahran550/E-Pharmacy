import { Column, Entity } from 'typeorm';
import { LocalizedNameColumn } from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';
import { DecimalColumn } from '../decimal-column.decorator';

export enum PlanType {
  INDIVIDUAL = 'INDIVIDUAL',
  FAMILY = 'FAMILY',
}
@Entity({ name: 'plan' })
export class Plan extends BaseEntity {
  @LocalizedNameColumn()
  localizedName: EmbededLocalizedName;

  @DecimalColumn({ nullable: true })
  price: number;

  @DecimalColumn({ nullable: true })
  pricePerMember?: number;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  type: PlanType;

  @Column({ type: 'jsonb', nullable: true })
  features: EmbededLocalizedName[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  order: number;
}
