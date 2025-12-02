import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity()
export class SupportRequest extends BaseEntity {
  @Column()
  title: string;

  @Column()
  body: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: Partial<User>;

  @Column({ unique: true })
  idempotencyKey: string;
}
