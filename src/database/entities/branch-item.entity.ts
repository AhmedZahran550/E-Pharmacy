import { Expose, Type } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { DecimalColumn } from '../decimal-column.decorator';
import { NullableLocalizedNameColumn } from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';

@Entity({ name: 'branch_item' })
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

  @DecimalColumn({ nullable: true })
  price: number;

  @Column({ default: true })
  isActive: boolean;
}
