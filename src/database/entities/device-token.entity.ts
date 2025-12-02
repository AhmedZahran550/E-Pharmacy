import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { DeviceInfo } from '@/modules/auth/dto/credentials.dto';

@Entity({ name: 'device_token' })
@Index('DEVICE_TOKEN_USER_IDX', ['user', 'deviceToken'], { unique: true })
export class DeviceToken extends BaseEntity {
  @Column()
  deviceToken: string;

  @Column({ type: 'jsonb', nullable: true })
  deviceInfo: DeviceInfo;

  @ManyToOne(() => User, (user) => user.deviceTokens, {
    onDelete: 'CASCADE',
  })
  user: User;
}
