import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ClosingBill, ClosingBillStatus } from './closing-bill.entity';

@Entity({ name: 'closing_bill_history' })
@Index('CLOSING_BILL_HISTORY_IDX', ['closingBill'])
export class ClosingBillHistory extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ClosingBillStatus,
  })
  fromStatus: ClosingBillStatus;

  @Column({
    type: 'enum',
    enum: ClosingBillStatus,
  })
  toStatus: ClosingBillStatus;

  @Column({ nullable: true })
  reason?: string;

  @ManyToOne(() => ClosingBill, { onDelete: 'CASCADE' })
  @JoinColumn()
  closingBill: ClosingBill;
}
