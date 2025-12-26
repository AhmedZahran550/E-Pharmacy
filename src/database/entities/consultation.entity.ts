import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Employee } from './employee.entity';
import { Branch } from './branch.entity';
import { Order } from './order.entity';
import { ConsultationMessage } from './consultation-message.entity';
import { MedicationSchedule } from './medication-schedule.entity';
import { DateColumn } from '@/common/decorators/date-column.decorator';
import { OrderRequest } from './order-request.entity';

export enum ConsultationStatus {
  REQUESTED = 'REQUESTED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum ConsultationType {
  GENERAL = 'GENERAL',
  MEDICATION_INQUIRY = 'MEDICATION_INQUIRY',
  PRESCRIPTION_REVIEW = 'PRESCRIPTION_REVIEW',
  SIDE_EFFECTS = 'SIDE_EFFECTS',
  DRUG_INTERACTION = 'DRUG_INTERACTION',
  DOSAGE_QUESTION = 'DOSAGE_QUESTION',
  CHRONIC_CONDITION = 'CHRONIC_CONDITION',
  NUTRITION_ADVICE = 'NUTRITION_ADVICE',
}

@Entity('consultations')
export class Consultation extends BaseEntity {
  @Column({ type: 'varchar', length: 20, unique: true })
  consultationNo: string; // e.g., "CONS-1234567890"

  @Column({ type: 'enum', enum: ConsultationType })
  type: ConsultationType;

  @Column({
    type: 'enum',
    enum: ConsultationStatus,
    default: ConsultationStatus.REQUESTED,
  })
  status: ConsultationStatus;

  @Column({ type: 'text', nullable: true })
  userInitialMessage: string;

  @Column({ type: 'text', nullable: true })
  doctorNotes: string; // Private notes from doctor

  @Column({ type: 'text', nullable: true })
  doctorSummary: string; // Summary shared with user

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // Auto-expire if not responded within X minutes

  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number;

  @Column({ type: 'text', nullable: true })
  ratingNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  uploadedImages: string[]; // Prescription or medical images

  // Relationships
  @ManyToOne(() => User, (user) => user.consultations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Employee, (employee) => employee.consultations, {
    nullable: true,
  })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Employee;

  @Column({ type: 'uuid', nullable: true })
  doctorId: string;

  @ManyToOne(() => Branch, (branch) => branch.consultations)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'uuid' })
  branchId: string;

  @OneToMany(() => ConsultationMessage, (message) => message.consultation)
  messages: ConsultationMessage[];

  @OneToMany(() => Order, (order) => order.consultation)
  orders: Order[];

  @OneToMany(() => MedicationSchedule, (schedule) => schedule.consultation)
  medicationSchedules: MedicationSchedule[];

  @OneToOne(() => OrderRequest, (orderRequest) => orderRequest.consultation, {
    nullable: true,
  })
  @JoinColumn({ name: 'order_request_id' })
  orderRequest: OrderRequest;

  @Column({ type: 'uuid', nullable: true })
  orderRequestId: string;
}
