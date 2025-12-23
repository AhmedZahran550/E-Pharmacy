import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { User } from './user.entity';

@Entity()
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  employee?: Employee;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User;
}
