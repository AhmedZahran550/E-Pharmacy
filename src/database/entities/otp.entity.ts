import { BaseEntity } from '@/database/entities/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('otp')
@Index('OTP_MOBILE_IDX', ['mobile'])
export class Otp extends BaseEntity {
  @Column()
  mobile: string;

  @Column()
  code: string;
}
