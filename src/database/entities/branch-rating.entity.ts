import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { User } from './user.entity';
import { DecimalColumn } from '../decimal-column.decorator';

@Entity({ name: 'branch_rating' })
@Index('BRANCH_RATING_USER_BRANCH_UNIQUE_IDX', ['user', 'branch'], {
  unique: true,
})
export class BranchRating extends BaseEntity {
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Partial<User>;

  @ManyToOne(() => Branch, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Partial<Branch>;

  @DecimalColumn({ nullable: false })
  @Column({ type: 'decimal', precision: 3, scale: 2 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
