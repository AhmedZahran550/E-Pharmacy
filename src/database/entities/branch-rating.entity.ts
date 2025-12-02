import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Branch } from './branch.entity';
import { Order } from './order.entity';
import { BaseEntity } from './base.entity';
import { ItemRating } from './item-rating.entity';

@Entity('branch_rating')
@Index('BRANCH_RATING_BRANCH_IDX', ['branch'])
@Index('BRANCH_RATING_BRANCH_USER_ORDER_IDX', ['branch', 'user', 'order'], {
  unique: true,
})
export class BranchRating extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Branch, { nullable: false })
  @JoinColumn()
  branch: Branch;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn()
  order?: Order;

  @Column('smallint')
  rating: number;

  @Column('text', { nullable: true })
  notes: string;

  @OneToMany(() => ItemRating, (itemRating) => itemRating.branchRating)
  itemsRating: ItemRating[];
}
