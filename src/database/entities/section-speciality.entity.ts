import {
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne
} from 'typeorm';

import { BaseEntity } from './base.entity';
import { Speciality } from './speciality.entity';
import { Section } from './section.entity';

const SPEICALITY_SECTION_UNIQUE_INDEX = 'SPEICALITY_SECTION_UNIQUE_INDEX';

@Entity({ name: 'section_speciality' })
@Index(SPEICALITY_SECTION_UNIQUE_INDEX, ['speciality', 'section'], { unique: true })
@Index('SPEICALITY_SECTION_SECTION_IDX', ['section'])
@Index('SPEICALITY_SECTION_SPECIALITY_IDX', ['speciality'])
export class SectionSpeciality extends BaseEntity {
  constructor(obj?: Partial<SectionSpeciality>) {
    super();
    obj && Object.assign(this, obj);
  }

  @ManyToOne(() => Speciality, (speciality) => speciality.sectionSpecialities, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  speciality: Speciality;

  @ManyToOne(() => Section, (section) => section.sectionSpecialities, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  section: Section;

  @Column({ default: true })
  isActive: boolean;
}
