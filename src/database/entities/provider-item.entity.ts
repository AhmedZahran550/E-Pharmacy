import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { DecimalColumn } from '../decimal-column.decorator';
import { NullableLocalizedNameColumn } from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';
import { Item } from './item.entity';
import { Provider } from './provider.entity';
import { BranchItem } from './branch-item.entity';
import { Expose, Type } from 'class-transformer';
import { CartItem } from './cart-item.entity';
@Entity({ name: 'provider_item' })
@Index('PROVIDER_ITEM_KEY_IDX', ['provider', 'item'], { unique: true })
@Index('PROVIDER_ITEM_PROVIDER_IDX', ['provider'])
@Index('PROVIDER_ITEM_ITEM_IDX', ['item'])
export class ProviderItem extends BaseEntity {
  constructor(obj?: Partial<ProviderItem>) {
    super();
    obj && Object.assign(this, obj);
  }

  @NullableLocalizedNameColumn()
  localizedName?: EmbededLocalizedName;

  @ManyToOne(() => Provider, (provider) => provider.providerItems, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  provider: Provider;

  @ManyToOne(() => Item, (item) => item.providerItems, {
    nullable: false,
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  item: Item;

  @OneToMany(() => BranchItem, (branchItem) => branchItem.providerItem)
  branchItems: BranchItem[];

  @DecimalColumn()
  sellingPrice: number;

  @DecimalColumn({ select: false })
  settlementPrice: number;

  @Column({ default: true })
  isActive: boolean;

  @Expose()
  @Type(() => EmbededLocalizedName)
  get name(): EmbededLocalizedName {
    if (
      this.localizedName &&
      this.localizedName.en !== null &&
      this.localizedName.ar !== null
    ) {
      return this.localizedName;
    }
    return this.item?.name;
  }
}
