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
import { ServiceRequestMessage } from './service-request-message.entity';

export enum ServiceRequestStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  CLARIFICATION_NEEDED = 'CLARIFICATION_NEEDED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum ServiceRequestType {
  DELEVARY_ORDER = 'DELEVARY_ORDER',
  PICKUP_ORDER = 'PICKUP_ORDER',
  HOME_VISIT = 'HOME_VISIT',
}

@Entity('service_requests')
export class ServiceRequest extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  requestNo: string; // e.g., "SRQ-1234567890"

  @Column({ type: 'enum', enum: ServiceRequestType })
  type: ServiceRequestType;

  @Column({
    type: 'enum',
    enum: ServiceRequestStatus,
    default: ServiceRequestStatus.PENDING,
  })
  status: ServiceRequestStatus;

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
  @ManyToOne(() => User, (user) => user.serviceRequests)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Branch, (branch) => branch.serviceRequests)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Employee, (employee) => employee.serviceRequests, {
    nullable: true,
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Employee;

  @Column({ type: 'uuid', nullable: true })
  doctorId: string;

  @OneToOne(() => Order, (order) => order.serviceRequest, { nullable: true })
  order: Order;

  @OneToOne(() => Consultation, (consultation) => consultation.serviceRequest, {
    nullable: true,
  })
  consultation: Consultation;

  // Ideally rename OrderRequestMessage to ServiceRequestMessage too, but user didn't explicitly ask for that detail,
  // but for consistency we should probably rename logic.
  // For now, I'll keep the entity import but rename the property to avoid breaking `OrderRequestMessage` if I don't rename it.
  // Actually, I should check if I need to rename `OrderRequestMessage`.
  // The prompt said "change the name of the order-request to service-request".
  // This likely implies cascading changes.
  // I will assume `OrderRequestMessage` should refer to `ServiceRequest`.

  @OneToMany(() => ServiceRequestMessage, (message) => message.request)
  messages: ServiceRequestMessage[];
}
