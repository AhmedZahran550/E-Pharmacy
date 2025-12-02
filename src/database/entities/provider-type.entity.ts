import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { LocalizedNameColumn } from '../localized-column.decorator';
import { EmbededLocalizedName } from './embeded/localized-name.entity';
import { MetadataEntity } from './metadata.entity';
import { Provider } from './provider.entity';
import { ProviderTypeSection } from './type-section.entity';

@Entity({ name: 'provider_type' })
export class ProviderType extends MetadataEntity {
  @PrimaryColumn()
  id: string;

  @LocalizedNameColumn()
  localizedName: EmbededLocalizedName;

  @Column({ nullable: true, default: true })
  isActive: boolean;

  @Column({ unique: true })
  code: string;

  @OneToMany(() => Provider, (provider) => provider.type, {
    cascade: true,
  })
  providers: Provider[];

  @Column({ default: 0 })
  order: number;

  @OneToMany(
    () => ProviderTypeSection,
    (providerTypeSection) => providerTypeSection.providerType,
  )
  providerTypeSections: ProviderTypeSection[];
}
