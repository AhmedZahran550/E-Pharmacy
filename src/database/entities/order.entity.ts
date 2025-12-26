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
import { Employee } from './employee.entity';
import { OrderHistory } from './order-history.entity';
import { OrderItem } from './order-item.entity';
import { Consultation } from './consultation.entity';
import { OrderRequest } from './order-request.entity';

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
@Check(
  `(status IN ('NEW', 'CANCELED', 'REJECTED', 'EXPIRED') OR total_amount IS NOT NULL)`,
)
export class Order extends BaseEntity {
  @DateColumn({ nullable: true })
  finalizedDate: Date; // Set when the order is either completed, expired or canceled

  @DecimalColumn({ nullable: true })
  totalAmount: number; // Total amount after discount

  @DecimalColumn({ nullable: true })
  totalDiscount: number; // Total discount for the order

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

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  orderItems: OrderItem[];

  @ManyToOne(() => Consultation, (consultation) => consultation.orders, {
    nullable: true,
  })
  @JoinColumn({ name: 'consultation_id' })
  consultation: Consultation;

  @Column({ type: 'uuid', nullable: true })
  consultationId: string;

  @OneToOne(() => OrderRequest, (orderRequest) => orderRequest.order, {
    nullable: true,
  })
  @JoinColumn({ name: 'order_request_id' })
  orderRequest: OrderRequest;

  @Column({ type: 'uuid', nullable: true })
  orderRequestId: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'created_by_doctor_id' })
  createdByDoctor: Employee;

  @Column({ type: 'uuid', nullable: true })
  createdByDoctorId: string;

  @Column({
    type: 'boolean',
    asExpression: `CASE WHEN "status" IN ('PICKED_UP', 'DELIVERED', 'CANCELED', 'EXPIRED' ,'REJECTED') THEN FALSE ELSE TRUE END`,
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
