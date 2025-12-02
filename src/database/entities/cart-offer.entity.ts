import {
  Entity,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Offer } from './offer.entity';
import { Cart } from './cart.entity';
import { BaseEntity } from '@/database/entities/base.entity';

@Index('CART_OFFER_CART_IDX', ['cart'])
@Index('CART_OFFER_OFFER_IDX', ['offer'])
@Unique(['cart', 'offer']) // Ensure the same offer isn't applied twice to the same cart
@Entity('cart_offer')
export class CartOffer extends BaseEntity {
  @ManyToOne(() => Cart, (cart) => cart.cartOffers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @ManyToOne(() => Offer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'offer_id' })
  offer: Offer;
}
