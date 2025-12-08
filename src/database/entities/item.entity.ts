import { Expose, Type } from 'class-transformer';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { DecimalColumn } from '../decimal-column.decorator';
import { LocalizedNameColumn } from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import { EmbededLocalizedName } from './embeded/localized-name.entity';

export enum ItemType {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
}

export type ItemUnit = {
  code: string;
  name_en: string;
  name_ar: string;
};

export enum ItemOrigin {
  LOCAL = 'LOCAL',
  IMPORTED = 'IMPORTED',
}
@Entity({ name: 'item' })
@Index('ITEM_NAME_IDX', ['localizedName.en', 'localizedName.ar'], {
  unique: true,
})
export class Item extends BaseEntity {
  @LocalizedNameColumn()
  @Expose()
  localizedName: EmbededLocalizedName;

  @Column({ nullable: true })
  instruction_en?: string;

  @Column({ nullable: true })
  instruction_ar?: string;

  @DecimalColumn()
  price: number;

  @Column({ default: true })
  isActive?: boolean;

  @Column({ default: false })
  approvalRequired?: boolean;

  @Column({ default: false })
  isPriceEditable?: boolean;

  @Column({ nullable: true })
  code?: string;

  @Column('jsonb', { nullable: true })
  units?: ItemUnit[];

  @Column('text', { array: true, nullable: true })
  images?: string[];

  @Column({
    type: 'enum',
    enum: ItemOrigin,
    nullable: true,
  })
  origin: ItemOrigin;

  @Column({
    type: 'enum',
    enum: ItemType,
    nullable: true,
  })
  type: ItemType;

  @Expose()
  @Type(() => EmbededLocalizedName)
  get name(): EmbededLocalizedName {
    return this.localizedName;
  }
}
