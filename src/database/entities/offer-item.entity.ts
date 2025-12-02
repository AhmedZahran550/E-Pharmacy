import { Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Item } from './item.entity';
import { Offer } from './offer.entity';
import { DecimalColumn } from '../decimal-column.decorator';

@Entity({ name: 'offer_item' })
@Index('OFFER_PROVIDER_ITEM_UNIQUE_IDX', ['offer', 'item'], {
  unique: true,
})
@Index('OFFER_ITEM_ITEM_IDX', ['item'])
@Index('OFFER_ITEM_OFFER_IDX', ['offer'])
export class OfferItem extends BaseEntity {
  @ManyToOne(() => Item, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  item: Item;

  @DecimalColumn()
  price: number;

  @ManyToOne(() => Offer, (offer) => offer.offerItems, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  offer: Offer;
}
