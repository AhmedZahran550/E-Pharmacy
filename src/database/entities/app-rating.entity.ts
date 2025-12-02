import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity'; // Assuming you have a User entity
import { BaseEntity } from './base.entity';

export enum RatingAction {
  RATE = 'RATE',
  CANCELED = 'CANCELED',
}

@Entity('app_rating')
@Index('APP_RATING_USER_IDX', ['user'])
export class AppRating extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('int', { nullable: true })
  rating: number;

  @Column({ nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: RatingAction,
    nullable: false,
  })
  action: RatingAction;
}
