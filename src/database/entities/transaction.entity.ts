import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { DecimalColumn } from '../decimal-column.decorator';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { Payment } from './payment.entity';

export enum TransactionType {
  ONLINE_PAYMENT = 'ONLINE_PAYMENT',
  BALANCE = 'BALANCE',
  REFUND = 'ONLINE_REFUND',
  BALANCE_REFUND = 'BALANCE_REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentMethod {
  MASTERCARD = 'MASTERCARD',
  VISA = 'VISA',
  MEEZA = 'MEEZA',
  SYMPL = 'SYMPL',
}
@Entity({ name: 'transaction' })
@Index('TRANSACTION_ORDER_IDX', ['order'])
export class Transaction extends BaseEntity {
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @DecimalColumn()
  amount: number;

  @Column({ nullable: true })
  currency: string;

  @ManyToOne(() => Order, (order) => order.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  order: Order;

  @ManyToOne(() => Payment, (payment) => payment.transactions, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  payment: Payment;

  @Column({ type: 'jsonb', nullable: true })
  error: {
    code: string;
    message: string;
  };

  @Column({
    type: 'enum',
    name: 'payment_method',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({ unique: true })
  idempotencyKey: string;
}
