import { Gender } from '@/common/models/gender.model';

import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  OneToMany,
} from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { Role } from '../../modules/auth/role.model';
import { BaseEntity } from './base.entity';

import { Notification } from './notification.entity';

import { DecimalColumn } from '../decimal-column.decorator';
import { Order } from './order.entity';
import { DeviceToken } from './device-token.entity';
import { encrypt } from '@/common/crypto';
import { Exclude } from 'class-transformer';
import { hmacHashing } from '@/common/hmac-hashing';

export const USER_EMAIL_IDX = 'user_email_idx';
export const USER_MOBILE_IDX = 'user_mobile_idx';
export const USER_NID_IDX = 'user_nid_idx';

export enum UserType {
  INDIVIDUAL = 'individual',
  CORPORATE = 'corporate',
}

export enum UserStatus {
  ACTIVE = 'active',
  PENDING_SUBSCRIPTION = 'pending_subscription',
}

export enum Relationship {
  PRINCIPAL = 'principal',
  SPOUSE = 'spouse',
  CHILD = 'child',
  PARENT = 'parent',
}

export interface UserPreferences {
  language: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

const LOCKED_DURATION_IN_MINUTES: number = process.env.LOCKED_DURATION
  ? parseInt(process.env.LOCKED_DURATION)
  : 30;
@Entity({ name: 'user' })
@Index('UQ_mobile_verified', ['mobile'], {
  unique: true,
  where: `"mobile_verified" = true`,
})
@Index('UQ_email_verified', ['email'], {
  unique: true,
  where: `"email_verified" = true`,
})
@Index('USER_UQ_mobile_nationalId', [, 'mobile', 'nationalId'], {
  unique: true,
})
@Index('USER_REFERRAL_CODE_IDX', ['referralCode'], { unique: true })
@Index('USER_CODE_IDX', ['code'], { unique: true })
export class User extends BaseEntity {
  @Column({ nullable: true })
  email?: string;

  @DateColumn()
  birthDate: Date;

  // Encrypted fields for storage
  @Exclude()
  @Column({
    nullable: true,
    select: false,
  })
  nationalIdEncrypted?: string;

  @Exclude()
  @Column({
    transformer: {
      to: (value: string) => value && hmacHashing(value),
      from: (value) => value,
    },
    nullable: true,
    select: false,
  })
  nationalId: string;

  @Column({ nullable: true })
  mobile: string;

  getFormattedMobile() {
    return `+${this.countryCode}${this.mobile}`;
  }

  @Column({ name: 'country_code', nullable: true })
  countryCode?: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ name: 'mobile_verified', nullable: true, default: false })
  mobileVerified?: boolean;

  @Column({ name: 'email_verified', nullable: true, default: false })
  emailVerified?: boolean;

  @Column({ name: 'id_verified', nullable: true, default: false })
  idVerified?: boolean;

  @Column({ nullable: false })
  code: string;

  @Column({ nullable: true })
  identityConfirmed?: boolean;

  @Column({ nullable: true, default: 0 })
  identityConfirmedTrials?: number;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'middle_name', nullable: true })
  middleName?: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'full_name', nullable: true, insert: false, update: false })
  fullName?: string;

  @Column({ nullable: true })
  points?: number;

  @OneToMany(() => DeviceToken, (appToken) => appToken.user)
  deviceTokens: DeviceToken[];

  @Column({ nullable: true, default: false })
  locked?: boolean;

  @DateColumn({ nullable: true })
  lockedAt?: Date;

  @Column({ nullable: true, default: false })
  disabled?: boolean;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender?: Gender;

  @Column({ nullable: true })
  qrCode?: string;

  @Column({ default: true })
  notificationsEnabled?: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {
      language: 'ar',
      pushNotificationsEnabled: true,
      emailNotificationsEnabled: true,
    },
  })
  preferences: UserPreferences;

  @Column({
    type: 'enum',
    enum: Role,
    array: true,
    nullable: true,
    default: [Role.USER, Role.APP_USER],
  })
  roles?: Role[];

  @OneToMany(() => Notification, (notification) => notification.recipient, {
    nullable: true,
  })
  notifications?: Notification[];

  @OneToMany(() => Order, (order) => order.user, {
    nullable: true,
  })
  orders?: Order[];

  @DecimalColumn({ precision: 10, scale: 2, default: 0.0 })
  currentBalance: number;

  @DateColumn({ nullable: true })
  lastLoginDate?: Date;

  @Column({ nullable: true })
  referralCode: string;

  @Column({
    type: 'boolean',
    asExpression: `"photo_url" IS NOT NULL`,
    generatedType: 'STORED',
    update: false,
  })
  isProfileCompleted: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  async beforeChanges() {
    if (this.nationalId?.length === 14) {
      this.nationalIdEncrypted = encrypt(this.nationalId);
    }
    if (this.locked && !this.lockedAt) {
      this.lockedAt = new Date();
    }
  }

  @AfterLoad()
  setAfterLoadData() {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
}
