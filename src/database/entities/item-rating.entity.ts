// src/database/entities/order-item-rating.entity.ts
import { Column, Entity, JoinColumn, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Item } from './item.entity';
import { BranchRating } from './branch-rating.entity';

@Entity('item_rating')
@Index('ITEM_RATING_BRANCH_RATING_ITEM_IDX', ['item', 'branchRating'], {
  unique: true,
}) // Changed from orderItem to item
export class ItemRating extends BaseEntity {
  @ManyToOne(() => BranchRating, { nullable: false, onDelete: 'CASCADE' }) // New relation
  @JoinColumn() // New foreign key
  branchRating: BranchRating;

  @ManyToOne(() => Item, { nullable: false }) // Changed from OrderItem to Item
  @JoinColumn() // Changed from order_item_id to item_id
  item: Item;

  @Column('smallint')
  rating: number;
}
