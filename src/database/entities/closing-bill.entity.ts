import { BaseEntity } from '@/database/entities/base.entity';
import { Governorate } from '@/database/entities/governorate.entity';
import { Column, Entity, Index, ManyToOne, Check, OneToMany } from 'typeorm';

import { DateColumn } from '../../common/decorators/date-column.decorator';
import { DecimalColumn } from '../decimal-column.decorator';
import { Provider } from './provider.entity';
import { Order } from './order.entity';

export enum ClosingBillStatus {
  NEW = 'NEW',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Index('CLOSING_BILL_PROVIDER_IDX', ['provider'])
@Entity('closing_bill')
export class ClosingBill extends BaseEntity {
  @Check(`"from" < "to"`)
  @DateColumn()
  from: Date;

  @DateColumn()
  to: Date;

  @DateColumn({ nullable: true })
  paidAt: Date;

  @DecimalColumn()
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: ClosingBillStatus,
    default: ClosingBillStatus.NEW,
  })
  status: ClosingBillStatus;

  @ManyToOne(() => Provider, (provider) => provider.closingBills)
  provider: Provider;

  @OneToMany(() => Order, (order) => order.closingBill)
  orders: Order;
}
