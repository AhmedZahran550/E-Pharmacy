import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { DecimalColumn } from '../decimal-column.decorator';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { CartItem } from './cart-item.entity';
import { CartOffer } from './cart-offer.entity';
import { Order } from './order.entity';
import { User } from './user.entity';

@Index('unique_open_cart_per_user', ['user', 'isCheckedOut', 'branch'], {
  unique: true,
  where: 'is_checked_out = false AND deleted_at IS NULL',
})
@Index('CART_USER_IDX', ['user'])
@Index('CART_BRANCH_IDX', ['branch'])
@Entity('cart')
export class Cart extends BaseEntity<Cart> {
  @Column({ nullable: true })
  appliedCode: string; // Stores the code (promo, or invitation)

  @DecimalColumn()
  totalAmount: number; // Total amount after discount

  @DecimalColumn({ nullable: true })
  coverageAmount: number; // Total coverage amount after discount

  @DecimalColumn()
  subTotal: number; // Total before discount

  @DecimalColumn({ nullable: true })
  totalDiscount: number; // Total discount for the order

  @ManyToOne(() => User, (user) => user.carts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @OneToMany(() => CartOffer, (cartOffer) => cartOffer.cart, {
    nullable: false,
    cascade: true,
  })
  cartOffers: CartOffer[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  cartItems: CartItem[];

  @OneToOne(() => Order, (order) => order.cart, {
    nullable: true,
  })
  order: Order;

  @ManyToOne(() => Branch, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  branch: Branch;

  @Column({ type: 'boolean', default: false })
  isCheckedOut: boolean;

  @Column({ type: 'boolean', default: false })
  isSaved: boolean;
}
