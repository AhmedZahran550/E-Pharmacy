import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Branch } from './branch.entity';
import { Employee } from './employee.entity';
import { Order } from './order.entity';
import { Consultation } from './consultation.entity';
import { OrderRequestMessage } from './order-request-message.entity';

export enum OrderRequestStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  CLARIFICATION_NEEDED = 'CLARIFICATION_NEEDED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum OrderRequestType {
  PRESCRIPTION_IMAGE = 'PRESCRIPTION_IMAGE',
  ITEM_SELECTION = 'ITEM_SELECTION',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  MIXED = 'MIXED',
}

@Entity('order_requests')
export class OrderRequest extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  requestNo: string; // e.g., "ORQ-1234567890"

  @Column({ type: 'enum', enum: OrderRequestType })
  type: OrderRequestType;

  @Column({
    type: 'enum',
    enum: OrderRequestStatus,
    default: OrderRequestStatus.PENDING,
  })
  status: OrderRequestStatus;

  @Column({ type: 'jsonb', nullable: true })
  prescriptionImages: string[]; // Array of image URLs

  @Column({ type: 'jsonb', nullable: true })
  selectedItems: {
    itemId: string;
    quantity: number;
  }[]; // Items selected from catalog

  @Column({ type: 'jsonb', nullable: true })
  manualItems: {
    medicationName: string;
    quantity?: number;
    dosage?: string;
  }[]; // Manually entered medication names

  @Column({ type: 'text', nullable: true })
  notes: string; // User notes

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // Auto-expire after X hours

  @Column({ type: 'text', nullable: true })
  doctorNotes: string; // Private notes from doctor

  // Relationships
  @ManyToOne(() => User, (user) => user.orderRequests)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Branch, (branch) => branch.orderRequests)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Employee, (employee) => employee.orderRequests, {
    nullable: true,
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Employee;

  @Column({ type: 'uuid', nullable: true })
  doctorId: string;

  @OneToOne(() => Order, (order) => order.orderRequest, { nullable: true })
  order: Order;

  @OneToOne(() => Consultation, (consultation) => consultation.orderRequest, {
    nullable: true,
  })
  consultation: Consultation;

  @OneToMany(() => OrderRequestMessage, (message) => message.orderRequest)
  messages: OrderRequestMessage[];
}
