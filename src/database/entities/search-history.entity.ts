import { Entity, ManyToOne, Column, Index, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity()
@Index('IDX_SEARCH_HISTORY_USER', ['user'])
export class SearchHistory extends BaseEntity {
  @Index()
  @Column()
  query: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  userId: string; // This should be included automatically
}
