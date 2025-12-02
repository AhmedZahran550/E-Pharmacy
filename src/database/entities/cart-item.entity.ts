import { Exclude } from 'class-transformer';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { DecimalColumn } from '../decimal-column.decorator';
import { BaseEntity } from './base.entity';
import { Cart } from './cart.entity';
import { Item } from './item.entity';

export type Extras = {
  lengthOfStayInDays: number;
};

@Entity('cart_item')
@Index('CART_ITEM_CART_IDX', ['cart'])
export class CartItem extends BaseEntity<CartItem> {
  @ManyToOne(() => Cart, (cart) => cart.cartItems, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Exclude()
  cart: Cart;

  // @Column({ nullable: true })
  // itemId: string;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  item: Item;

  @Column({ type: 'integer', default: 1 })
  quantity?: number;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  extras?: Extras;

  @DecimalColumn()
  unitPrice: number;

  @DecimalColumn()
  totalPrice: number;
}
