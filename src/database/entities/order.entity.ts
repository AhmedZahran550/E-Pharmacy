import {
  BeforeInsert,
  BeforeUpdate,
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { DecimalColumn } from '../decimal-column.decorator';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { User } from './user.entity';
import { OrderHistory } from './order-history.entity';

export enum OrderType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
}

export enum OrderStatus {
  NEW = 'NEW',
  ACCEPTED = 'ACCEPTED',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  PICKED_UP = 'PICKED_UP',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

@Entity({ name: 'order' })
@Index('ORDER_USER_IDX', ['user'])
@Index('ORDER_BRANCH_IDX', ['branch'])
@Check(`(status <> 'REJECTED' OR rejection_reason IS NOT NULL)`)
export class Order extends BaseEntity {
  @DateColumn({ nullable: true })
  finalizedDate: Date; // Set when the order is either completed, expired or canceled

  @DecimalColumn()
  totalAmount: number; // Total amount after discount

  @DecimalColumn({ nullable: true })
  coverageAmount: number; // Total coverage amount

  @DecimalColumn()
  subTotal: number; // Total before discount

  @DecimalColumn({ nullable: true })
  totalDiscount: number; // Total discount for the order

  @DecimalColumn({ default: 0 })
  paidAmount: number;

  @DecimalColumn({
    asExpression: `"total_amount" - "paid_amount"`,
    generatedType: 'STORED', // Or 'STORED' depending on your DB support and preference
  })
  remainingAmount: number;

  @Column({
    type: 'enum',
    enum: OrderType,
  })
  type: OrderType;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.NEW,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ unique: true })
  orderNo: string;

  @Column({ nullable: true })
  appliedCode: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  items?: any[];

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Branch, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  branch: Branch;

  @OneToMany(() => OrderHistory, (history) => history.order)
  history?: OrderHistory[];

  @Column({
    type: 'boolean',
    asExpression: `CASE WHEN "status" IN ('COMPLETED', 'CANCELED', 'EXPIRED' ,'REJECTED') THEN FALSE ELSE TRUE END`,
    generatedType: 'STORED',
  })
  isOpen: boolean;

  @BeforeInsert()
  generateOrderNo() {
    // Get the last 6 digits of the current timestamp
    const timestampPart = Date.now().toString().slice(-6);

    // Generate a 4-digit random number
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();

    // Combine to form a 10-digit order number
    this.orderNo = `${randomPart}${timestampPart}`;
  }
}
