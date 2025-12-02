import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Section } from './section.entity';
import { Provider } from './provider.entity';
import { ProviderType } from './provider-type.entity';

@Entity({ name: 'provider_type_section' })
export class ProviderTypeSection extends BaseEntity {
  constructor(obj?: Partial<ProviderTypeSection>) {
    super();
    obj && Object.assign(this, obj);
  }

  @ManyToOne(() => Section, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  section: Section;

  @Index('PROVIDER_TYPE_SECTION_PROVIDER_IDX')
  @ManyToOne(() => ProviderType, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  providerType: ProviderType;
}
