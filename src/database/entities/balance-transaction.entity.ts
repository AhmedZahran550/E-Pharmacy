import { User } from '@/database/entities/user.entity';
import { Check, Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DecimalColumn } from '../decimal-column.decorator';

export enum BalanceType {
  CREDIT = 'CREDIT', // e.g., Loyalty point conversion, refunds
  DEBIT = 'DEBIT', // e.g., Service payments
  REFUND = 'REFUND', // Specific to refunds if separate from CREDIT
  LOYALTY_REDEMPTION = 'LOYALTY_REDEMPTION', // Converting loyalty points to balance
  ADJUSTMENT_CREDIT = 'ADJUSTMENT_CREDIT', // Positive adjustment
  ADJUSTMENT_DEBIT = 'ADJUSTMENT_DEBIT', // Negative adjustment
}

@Entity({ name: 'balance_transaction' })
@Index(['user'])
export class BalanceTransaction extends BaseEntity {
  @ManyToOne(() => User, (user) => user.balanceTransactions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({
    type: 'enum',
    enum: BalanceType,
  })
  type: BalanceType;

  @DecimalColumn()
  amount: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  relatedEntityId?: string;

  @Column({ unique: true, nullable: true })
  idempotencyKey: string;
}
