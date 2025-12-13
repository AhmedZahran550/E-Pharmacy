import { City } from '@/database/entities/city.entity';
import {
  LocalizedAddress,
  LocalizedAddressColumn,
} from '@/database/entities/embeded/localized-address.entity';
import { Point } from 'geojson';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { LocalizedNameColumn } from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import { BranchItem } from './branch-item.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';
import { Provider } from './provider.entity';

import { Exclude } from 'class-transformer';
import * as argon from 'argon2';

import { DecimalColumn } from '../decimal-column.decorator';
import { SystemNotification } from './system-notification.entity';

@Entity({ name: 'branch' })
@Index('BRANCH_LOCATION_UNIQUE_IDX', ['provider', 'longitude', 'latitude'], {
  unique: true,
})
@Index('BRANCH_PROVIDER_SPECIALITY_IDX', ['provider', 'isActive'])
@Index('idx_branch_location', ['location'], { spatial: true })
export class Branch extends BaseEntity {
  @LocalizedNameColumn()
  localizedName: EmbededLocalizedName;

  @LocalizedAddressColumn()
  address: LocalizedAddress;

  @Column('text', { array: true, nullable: true })
  telephones: string[];

  @Column('text', { array: true, nullable: true })
  images: string[];

  @Column({ nullable: true })
  whatsAppTelephone: string;

  @DecimalColumn({ nullable: true })
  averageRating: number;

  @Column({ nullable: true, default: 0 })
  ratingCount: number;

  @Column({ nullable: true, type: 'double precision' })
  latitude: number;

  @Column({ nullable: true, type: 'double precision' })
  longitude: number;

  @Column({ default: true })
  isActive: boolean;

  @Index('BRANCH_CITY_IDX')
  @ManyToOne(() => City, {
    nullable: true,
    eager: true,
  })
  @JoinColumn()
  city: Partial<City>;

  @Column({
    type: 'geometry', // Stores as native PostGIS geometry type
    spatialFeatureType: 'Point', // Good practice to specify
    srid: 4326, // Informs TypeORM about the SRID, matches the one below
    asExpression: `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)`, // Generate point WITH SRID
    generatedType: 'STORED', // Ensures the geometry with SRID is stored
    update: false, // Prevents updates to this column directly
  })
  location: Point; // This will typically be a GeoJSON Point object in your app

  @Index('BRANCH_PROVIDER_IDX')
  @ManyToOne(() => Provider, (provider) => provider.branches, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  provider: Partial<Provider>;

  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression: `to_tsvector('english', 
    COALESCE(name_en, '') || ' ' || COALESCE(name_ar, ''))`,
    select: false,
  })
  searchVector?: string;

  @Column({ default: false })
  isAlwaysOpen: boolean;

  @OneToMany(() => BranchItem, (providerItem) => providerItem.branch)
  items: BranchItem[];

  @OneToMany(() => SystemNotification, (notification) => notification.branch)
  notifications: SystemNotification[];

  @Exclude()
  @Column({ select: false, nullable: true })
  adminPassword: string;

  @BeforeInsert()
  @BeforeUpdate()
  async beforeChanges() {
    if (this.adminPassword) {
      this.adminPassword = await argon.hash(this.adminPassword);
    }
  }

  distance?: number;
}
