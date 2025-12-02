import { BaseEntity } from '@/database/entities/base.entity';
import { City } from '@/database/entities/city.entity';
import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { LocalizedNameColumn } from '../localized-column.decorator';
import { EmbededLocalizedName } from './embeded/localized-name.entity';

@Entity({ name: 'governorate' })
@Unique('uq_governorate_name_en', ['localizedName.en']) // Unique constraint for provider and English name
@Unique('uq_governorate_name_ar', ['localizedName.ar']) // Unique constraint for provider and English name
export class Governorate extends BaseEntity {
  @LocalizedNameColumn()
  localizedName: EmbededLocalizedName;

  @OneToMany(() => City, (city) => city.governorate, {
    // eager: true,
  })
  cities: City[];

  @Column({
    type: 'tsvector',
    generatedType: 'STORED',
    asExpression: `to_tsvector('english', 
        COALESCE(name_en, '') || ' ' || COALESCE(name_ar, ''))`,
    select: false,
  })
  searchVector?: string;
}
