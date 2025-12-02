import { Column, Entity, OneToMany } from 'typeorm';
import { LocalizedNameColumn } from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';
import { ProviderSection } from './provider-section.entity';
import { SectionSpeciality } from './section-speciality.entity';
import { ProviderTypeSection } from './type-section.entity';

export enum SectionCategory {
  INPATIENT = 'INPATIENT',
  OUTPATIENT = 'OUTPATIENT',
  OTHER = 'OTHER',
}
@Entity({ name: 'section' })
export class Section extends BaseEntity {
  constructor(obj?: Partial<Section>) {
    super();
    obj && Object.assign(this, obj);
  }
  @Column({ nullable: true })
  code: string;

  @LocalizedNameColumn()
  name?: EmbededLocalizedName;

  @Column({ nullable: true })
  order: number;

  @Column({
    type: 'enum',
    enum: SectionCategory,
    nullable: true,
  })
  category: SectionCategory;

  @OneToMany(
    () => SectionSpeciality,
    (sectionSpeciality) => sectionSpeciality.section,
  )
  sectionSpecialities: SectionSpeciality[];

  @OneToMany(
    () => ProviderSection,
    (providerSection) => providerSection.section,
  )
  providerSections: ProviderSection[];

  @OneToMany(
    () => ProviderTypeSection,
    (providerTypeSection) => providerTypeSection.section,
  )
  providerTypeSections: ProviderTypeSection[];

  @Column({ default: true })
  isActive: boolean;
}
