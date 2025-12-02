import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Transaction } from './transaction.entity';
import { DecimalColumn } from '../decimal-column.decorator';

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum RefundReason {
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  SERVICE_NOT_AVAILABLE = 'SERVICE_NOT_AVAILABLE',
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',
  SUBSCRIPTION_CANCELLATION = 'SUBSCRIPTION_CANCELLATION',
  OTHER = 'OTHER',
}

@Entity({ name: 'refund_request' })
@Index('REFUND_REQUEST_ORIGINAL_TRANSACTION_IDX', ['originalTransaction'])
@Index('REFUND_REQUEST_REFUND_TRANSACTION_IDX', ['refundTransaction'])
export class RefundRequest extends BaseEntity {
  @ManyToOne(() => Transaction, { onDelete: 'RESTRICT' })
  @JoinColumn()
  originalTransaction: Transaction;

  @ManyToOne(() => Transaction, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn()
  refundTransaction: Transaction;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING,
  })
  status: RefundStatus;

  @Column({
    type: 'enum',
    enum: RefundReason,
  })
  reason: RefundReason;

  @DecimalColumn()
  amount: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;
}
