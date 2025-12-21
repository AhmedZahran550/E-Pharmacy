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

import { Exclude } from 'class-transformer';
import * as argon from 'argon2';
import { SystemNotification } from './system-notification.entity';

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

  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression: `to_tsvector('english', COALESCE(name_en, '') || ' ' || COALESCE(address_en, ''))`,
    select: false,
  })
  searchVectorEn?: string;

  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression: `to_tsvector('arabic', COALESCE(name_ar, '') || ' ' || COALESCE(address_ar, ''))`,
    select: false,
  })
  searchVectorAr?: string;

  @Exclude()
  @Column({ select: false, nullable: true })
  adminPassword: string;

  @OneToMany(() => SystemNotification, (notification) => notification.provider)
  notifications: SystemNotification[];

  @BeforeInsert()
  @BeforeUpdate()
  async beforeChanges() {
    if (this.adminPassword) {
      this.adminPassword = await argon.hash(this.adminPassword);
    }
  }
}
