import { Expose, Type } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { NullableLocalizedNameColumn } from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';
import { ProviderItem } from './provider-item.entity';
import { Item } from './item.entity';
import { Speciality } from './speciality.entity';

const SPECIALITY_ITEM_UNIQUE_IDX = 'SPECIALITY_ITEM_UNIQUE_IDX';
@Entity({ name: 'speciality_item' })
@Index(SPECIALITY_ITEM_UNIQUE_IDX, ['item', 'speciality'], { unique: true })
@Index('SPECIALITY_ITEM_ITEM_IDX', ['item'])
@Index('SPECIALITY_ITEM_SPECIALITY_IDX', ['speciality'])
export class SpecialityItem extends BaseEntity {
  constructor(obj?: Partial<SpecialityItem>) {
    super();
    obj && Object.assign(this, obj);
  }

  @ManyToOne(() => Item, (item) => item.specialityItems, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  item: Item;

  @ManyToOne(() => Speciality, (speciality) => speciality.specialityItems, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  speciality: Speciality;

  @Column({ default: true })
  isActive: boolean;
}
