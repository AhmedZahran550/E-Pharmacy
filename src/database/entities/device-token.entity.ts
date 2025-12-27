import { Column, Entity, Index, ManyToOne, Check, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Employee } from './employee.entity';
import { DeviceInfo } from '@/modules/auth/dto/credentials.dto';

@Entity({ name: 'device_token' })
@Index('DEVICE_TOKEN_USER_IDX', ['user', 'deviceToken'], {
  unique: true,
  where: '"user_id" IS NOT NULL',
})
@Index('DEVICE_TOKEN_EMPLOYEE_IDX', ['employee', 'deviceToken'], {
  unique: true,
  where: '"employee_id" IS NOT NULL',
})
@Check(
  'CHK_USER_OR_EMPLOYEE',
  '("user_id" IS NOT NULL AND "employee_id" IS NULL) OR ("user_id" IS NULL AND "employee_id" IS NOT NULL)',
)
export class DeviceToken extends BaseEntity {
  @Column()
  deviceToken: string;

  @Column({ type: 'jsonb', nullable: true })
  deviceInfo: DeviceInfo;

  @ManyToOne(() => User, (user) => user.deviceTokens, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'uuid', nullable: true })
  employeeId: string;
}
