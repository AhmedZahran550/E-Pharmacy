import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { LocalizedNameColumn } from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import {
  LocalizedAddress,
  LocalizedAddressColumn,
} from './embeded/localized-address.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';
import { ProviderItem } from './provider-item.entity';
import { ProviderSection } from './provider-section.entity';
import { ProviderType } from './provider-type.entity';
import { ProviderSpeciality } from './provider-speciality.entity';
import { ClosingBill } from './closing-bill.entity';
import { nullable } from 'zod';
import { SystemNotification } from './system-notification.entity';
import { Exclude } from 'class-transformer';
import * as argon from 'argon2';

export enum ClosingPeriodType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
}

@Entity({ name: 'provider' })
@Index('UQ_provider_name_ar', ['localizedName.ar'], {
  unique: true,
})
@Index('UQ_provider_name_en', ['localizedName.en'], {
  unique: true,
})
export class Provider extends BaseEntity {
  @LocalizedNameColumn()
  localizedName: EmbededLocalizedName;

  @LocalizedAddressColumn({
    prefix: false,
    nullable: true,
  })
  address: LocalizedAddress;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Branch, (branch) => branch.provider, {
    cascade: true,
  })
  branches?: Branch[];

  @Column({ default: false })
  requireOrderOTP: boolean;

  @Column({ default: false })
  ratingHidden: boolean;

  @Column({ default: false })
  ratingDisabled: boolean;

  @Column({
    type: 'enum',
    enum: ClosingPeriodType,
    default: ClosingPeriodType.MONTHLY,
    nullable: true,
  })
  closingPeriodType: ClosingPeriodType;

  @OneToMany(() => ProviderItem, (ProviderItem) => ProviderItem.provider, {
    cascade: true,
  })
  providerItems?: ProviderItem[];

  @Index('PROVIDER_TYPE_UNIQUE_IDX')
  @ManyToOne(() => ProviderType, (providerType) => providerType.providers, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  type: ProviderType;

  @OneToMany(
    () => ProviderSection,
    (providerSection) => providerSection.provider,
  )
  providerSections: ProviderSection[];
  @OneToMany(() => ClosingBill, (ClosingBill) => ClosingBill.provider)
  closingBills: ClosingBill[];

  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression: `to_tsvector('english', 
    COALESCE(name_en, '') || ' ' || COALESCE(name_ar, ''))`,
    select: false,
  })
  searchVector?: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  adminPassword: string;

  @OneToMany(
    () => ProviderSpeciality,
    (providerSpeciality) => providerSpeciality.provider,
  )
  providerSpecialities: ProviderSpeciality[];

  @OneToMany(() => SystemNotification, (notification) => notification.provider)
  notifications?: SystemNotification[];

  @BeforeInsert()
  @BeforeUpdate()
  async beforeChanges() {
    if (this.adminPassword) {
      this.adminPassword = await argon.hash(this.adminPassword);
    }
  }
}
