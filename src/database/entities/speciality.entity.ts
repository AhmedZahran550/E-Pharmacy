import { Column, Entity, Index, OneToMany } from 'typeorm';
import { LocalizedNameColumn } from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';
import { SectionSpeciality } from './section-speciality.entity';
import { SpecialityItem } from './speciality-item.entity';
import { ProviderSpeciality } from './provider-speciality.entity';

const SPECIALITY_NAME_EN_IDX = 'SPECIALITY_NAME_EN_IDX';
const SPECIALITY_NAME_AR_IDX = 'SPECIALITY_NAME_AR_IDX';
@Entity({ name: 'speciality' })
@Index(SPECIALITY_NAME_EN_IDX, ['localizedName.en'], { unique: true })
@Index(SPECIALITY_NAME_AR_IDX, ['localizedName.ar'], { unique: true })
export class Speciality extends BaseEntity {
  @LocalizedNameColumn()
  localizedName: EmbededLocalizedName;

  @Column({ nullable: true, default: true })
  isActive: boolean;

  @Column({ nullable: true })
  code: string;

  @OneToMany(
    () => SpecialityItem,
    (specialityItem) => specialityItem.speciality,
  )
  specialityItems: SpecialityItem[];

  @OneToMany(
    () => SectionSpeciality,
    (sectionSpeciality) => sectionSpeciality.speciality,
  )
  sectionSpecialities: SectionSpeciality[];

  @OneToMany(
    () => ProviderSpeciality,
    (providerSpeciality) => providerSpeciality.speciality,
  )
  providerSpecialities: ProviderSpeciality[];

  @Column({ nullable: true })
  notes_en: string;

  @Column({ nullable: true })
  notes_ar: string;
}
