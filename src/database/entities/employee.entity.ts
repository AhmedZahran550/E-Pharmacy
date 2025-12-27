import { Gender } from '@/common/models/gender.model';
import * as argon from 'argon2';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { Role } from '../../modules/auth/role.model';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Exclude } from 'class-transformer';

import { Policy } from '@/modules/auth/policies.types';
import { Consultation } from './consultation.entity';
import { ServiceRequest } from './service-request.entity';
import { Order } from './order.entity';

const LOCKED_DURATION_IN_MINUTES: number = process.env.LOCKED_DURATION
  ? parseInt(process.env.LOCKED_DURATION)
  : 30;

export enum EmployeeType {
  SYSTEM = 'system',
  PROVIDER = 'provider',
}

@Index('EMPLOYEE_EMAIL_IDX', ['email'], { unique: true })
@Index('EMPLOYEE_BRANCH_IDX', ['branch'])
@Entity({ name: 'employee' })
export class Employee extends BaseEntity {
  @Column()
  email: string;

  @Column({ unique: true, nullable: true })
  mobile: string;

  @Column({ name: 'mobile_verified', nullable: false, default: false })
  mobileVerified: boolean;

  @Column({ name: 'email_verified', nullable: false, default: false })
  emailVerified: boolean;

  @Exclude()
  @Column({ select: false })
  password: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true, default: false })
  disabled?: boolean;

  @Column({ nullable: true, default: false })
  locked?: boolean;

  @DateColumn({ nullable: true })
  lockedAt?: Date;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender?: Gender;

  @Column({
    type: 'enum',
    enum: EmployeeType,
    nullable: true,
  })
  type?: EmployeeType;

  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    nullable: false,
  })
  roles?: Role[];

  @Column({ type: 'json', nullable: true })
  policies?: Policy[];

  @Column({ default: false })
  isOnline?: boolean;

  @DateColumn({ nullable: true })
  lastActiveAt?: Date;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalRaters: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  branch: Branch;

  @OneToMany(() => Consultation, (consultation) => consultation.doctor)
  consultations: Consultation[];

  @Column({ type: 'boolean', default: true })
  availableForConsultation: boolean;

  @Column({ type: 'int', default: 0 })
  activeConsultationsCount: number;

  @Column({ type: 'int', default: 3 })
  maxConcurrentConsultations: number;

  @OneToMany(() => ServiceRequest, (serviceRequest) => serviceRequest.doctor)
  serviceRequests: ServiceRequest[];

  @OneToMany(() => Order, (order) => order.createdByDoctor)
  createdOrders: Order[];

  @Column({ type: 'boolean', default: true })
  isVisibleToPublic: boolean; // For doctor discovery

  @Column({ type: 'text', nullable: true })
  specialties: string; // Comma-separated

  @Column({ type: 'text', nullable: true })
  bio: string; // Doctor biography

  @Column({ type: 'int', default: 0 })
  totalConsultations: number;

  @BeforeInsert()
  @BeforeUpdate()
  async beforeChanges() {
    if (this.password && this.password?.startsWith('$argon2')) {
      return;
    }
    if (this.password) {
      this.password = await argon.hash(this.password);
    }
    if (this.locked && !this.lockedAt) {
      this.lockedAt = new Date();
    }
  }
}
