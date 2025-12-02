import { BaseEntity } from '@/database/entities/base.entity';
import { Governorate } from '@/database/entities/governorate.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { LocalizedNameColumn } from '../localized-column.decorator';
import { Branch } from './branch.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';

@Entity({ name: 'city' })
@Unique('uq_city_governorate_name_en', ['governorate', 'localizedName.en'])
@Unique('uq_city_governorate_name_ar', ['governorate', 'localizedName.ar'])
@Index('CITY_GOVERNORATE_IDX', ['governorate'])
export class City extends BaseEntity {
  @LocalizedNameColumn()
  localizedName: EmbededLocalizedName;

  @ManyToOne(() => Governorate, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  governorate: Governorate;

  @OneToMany(() => Branch, (branch) => branch.city)
  branches: Branch[];

  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression: `to_tsvector('english', 
      COALESCE(name_en, '') || ' ' || COALESCE(name_ar, ''))`,
    select: false,
  })
  searchVector?: string;
}
