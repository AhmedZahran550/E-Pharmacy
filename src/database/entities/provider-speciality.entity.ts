import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Provider } from './provider.entity';
import { Speciality } from './speciality.entity';

@Entity({ name: 'provider_speciality' })
@Index('PROVIDER_SPECIALITY_UNIQUE_INDEX', ['speciality', 'provider'], {
  unique: true,
})
@Index('PROVIDER_SPECIALITY_SECTION_IDX', ['provider'])
@Index('PROVIDER_SPECIALITY_SPECIALITY_IDX', ['speciality'])
export class ProviderSpeciality extends BaseEntity {
  constructor(obj?: Partial<ProviderSpeciality>) {
    super();
    obj && Object.assign(this, obj);
  }

  @ManyToOne(
    () => Speciality,
    (speciality) => speciality.providerSpecialities,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      nullable: false,
    },
  )
  @JoinColumn()
  speciality: Speciality;

  @ManyToOne(() => Provider, (provider) => provider.providerSpecialities, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  provider: Provider;

  @Column({ default: true })
  isActive: boolean;
}
