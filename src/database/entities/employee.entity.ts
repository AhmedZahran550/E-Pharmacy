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
