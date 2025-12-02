import { Entity, Column, ManyToOne, Index, BeforeInsert } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

export enum PointsTransactionType {
  REFERRAL = 'REFERRAL',
  SUBSCRIPTION = 'SUBSCRIPTION',
  INVITATION = 'INVITATION',
  REDEEM = 'REDEEM',
  MANUAL = 'MANUAL',
  ADD_MEMBER = 'ADD_MEMBER',
  ORDER = 'ORDER',
  PROFILE_COMPLETION = 'PROFILE_COMPLETION',
  EXPIRATION = 'EXPIRATION', // Add this for expired points
}

export enum PointRelatedEntityType {
  ORDER = 'ORDER',
  SUBSCRIPTION = 'SUBSCRIPTION',
  USER = 'USER',
  LOYALTY_POINTS = 'LOYALTY_POINTS', // Add this to reference original earning record
}

export interface LoyaltyPointRelatedEntity {
  type: PointRelatedEntityType;
  id: number | string;
}

@Entity()
@Index('LOYALTY_POINTS_USER_IDX', ['user'])
@Index('LOYALTY_POINTS_EXPIRY_IDX', ['expiresAt']) // Add for efficient expiration queries
@Index('LOYALTY_POINTS_TYPE_IDX', ['type']) // Add for transaction type queries
export class LoyaltyPoints extends BaseEntity {
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: PointsTransactionType,
  })
  type: PointsTransactionType;

  @Column('int')
  points: number; // Positive for earned, negative for redeemed/expired

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  relatedEntity: LoyaltyPointRelatedEntity;

  @Column({ default: false })
  isExpired?: boolean;

  @Column({
    type: 'int',
    nullable: true,
    asExpression: `CASE WHEN "is_expired" = true OR "points" <= 0 THEN null ELSE "points" - "redeemed_points" END`,
    generatedType: 'STORED',
  })
  availablePoints?: number;

  @Column({ default: 0, nullable: true })
  redeemedPoints?: number;

  // Only add expiration date for earning transactions (positive points)
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;
}
