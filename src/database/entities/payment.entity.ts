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
import { Transaction } from './transaction.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PROCESSING = 'PROCESSING',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
}
export enum PayerType {
  USER = 'USER',
  CUSTOMER = 'CUSTOMER',
}

@Entity({ name: 'payment' })
@Index('PAYMENT_ORDER_IDX', ['order'])
@Index('PAYMENT_UNIQUE_OPENED_ORDER_PAYER_TYPE_IDX', ['order', 'payerType'], {
  where: "status IN ('PENDING','PROCESSING','REQUIRES_ACTION')",
  unique: true,
})
export class Payment extends BaseEntity {
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PayerType,
  })
  payerType: PayerType;

  @DecimalColumn()
  amount: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  error: {
    code: string;
    message: string;
  };

  @ManyToOne(() => Order, (order) => order.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  order: Order;

  @OneToMany(() => Transaction, (transaction) => transaction.payment)
  transactions: Transaction[];

  @Column({ unique: true })
  idempotencyKey: string;
}
