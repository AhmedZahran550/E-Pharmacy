import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { BloodType } from '@/common/models/medical-info.model';
import { DecimalColumn } from '../decimal-column.decorator';
import { Allergy, ChronicCondition } from '@/common/models/medical-info.model';

@Entity({ name: 'medical_profile' })
export class MedicalProfile extends BaseEntity {
  @OneToOne(() => User, (user) => user.medicalProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: BloodType,
    nullable: true,
  })
  bloodType?: BloodType;

  // Change to Enum array for strict validation
  @Column({
    type: 'enum',
    enum: Allergy,
    array: true,
    nullable: true,
  })
  allergies?: Allergy[];

  @Column({
    type: 'enum',
    enum: ChronicCondition,
    array: true,
    nullable: true,
  })
  chronicConditions?: ChronicCondition[];

  @Column('text', { array: true, nullable: true })
  currentMedications?: string[];

  @DecimalColumn({ nullable: true })
  height?: number; // In cm

  @DecimalColumn({ nullable: true })
  weight?: number; // In kg

  @Column({ nullable: true })
  insuranceProvider?: string;

  @Column({ nullable: true })
  insurancePolicyNumber?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
