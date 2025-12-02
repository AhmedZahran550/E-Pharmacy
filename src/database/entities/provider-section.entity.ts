import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Section } from './section.entity';
import { Provider } from './provider.entity';

const PROVIDER_SECTION_UNIQUE_INDEX = 'PROVIDER_SECTION_UNIQUE_INDEX';
@Entity({ name: 'provider_section' })
@Index(PROVIDER_SECTION_UNIQUE_INDEX, ['section', 'provider'], { unique: true })
@Index('PROVIDER_SECTION_SECTION_IDX', ['section'])
@Index('PROVIDER_SECTION_PROVIDER_IDX', ['provider'])
export class ProviderSection extends BaseEntity {
  constructor(obj?: Partial<ProviderSection>) {
    super();
    obj && Object.assign(this, obj);
  }

  @ManyToOne(() => Section, (section) => section.providerSections, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  section: Section;

  @ManyToOne(() => Provider, (provider) => provider.providerSections, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  provider: Provider;

  @Column({ default: true })
  isActive: boolean;
}
