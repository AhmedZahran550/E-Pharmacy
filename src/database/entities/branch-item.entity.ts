import { Expose, Type } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DecimalColumn } from '../decimal-column.decorator';
import { NullableLocalizedNameColumn } from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';
import { ProviderItem } from './provider-item.entity';
@Entity({ name: 'branch_item' })
@Index('BRANCH_ITEM_KEY_IDX', ['branch', 'providerItem'], { unique: true })
@Index('BRANCH_ITEM_PROVIDER_ITEM_IDX', ['providerItem'])
@Index('BRANCH_ITEM_BRANCH_IDX', ['branch'])
export class BranchItem extends BaseEntity {
  constructor(obj?: Partial<BranchItem>) {
    super();
    obj && Object.assign(this, obj);
  }

  @NullableLocalizedNameColumn()
  localizedName?: EmbededLocalizedName;

  @ManyToOne(() => Branch, (branch) => branch.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  branch: Partial<Branch>;

  @ManyToOne(() => ProviderItem, (providerItem) => providerItem.branchItems, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  providerItem: Partial<ProviderItem>;

  @DecimalColumn({ nullable: true })
  price: number;

  @Column({ default: true })
  isActive: boolean;

  @Expose()
  @Type(() => EmbededLocalizedName)
  get name(): EmbededLocalizedName {
    if (Object.keys(this.localizedName).length > 0) {
      return this.localizedName;
    }
    return this.providerItem?.name;
  }
}
