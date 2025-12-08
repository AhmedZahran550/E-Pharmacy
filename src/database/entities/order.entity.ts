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

import { OrderItem } from './order-item.entity';
import { OrderOtp } from './order-otp.entity';

import { User } from './user.entity';

export enum OrderType {
  ITEM_ORDER = 'ITEM_ORDER',
  SUBSCRIPTION_ORDER = 'SUBSCRIPTION_ORDER',
}

export enum OrderStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  COMPLETED = 'COMPLETED',
  CONFIRMED = 'CONFIRMED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
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

  @OneToMany(() => OrderOtp, (item) => item.order, {
    cascade: true,
  })
  orderOtps: OrderOtp[];

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
