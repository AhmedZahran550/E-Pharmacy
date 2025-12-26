import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Consultation } from './consultation.entity';
import { User } from './user.entity';
import { Employee } from './employee.entity';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  MEDICATION_LINK = 'MEDICATION_LINK',
  SYSTEM = 'SYSTEM',
}

export enum SenderRole {
  USER = 'USER',
  DOCTOR = 'DOCTOR',
  SYSTEM = 'SYSTEM',
}

@Entity('consultation_messages')
export class ConsultationMessage extends BaseEntity {
  @Column({ type: 'enum', enum: MessageType })
  type: MessageType;

  @Column({ type: 'enum', enum: SenderRole })
  senderRole: SenderRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  messageMetadata: {
    itemId?: string;
    imageUrl?: string;
    documentUrl?: string;
    fileName?: string;
  };

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  // Relationships
  @ManyToOne(() => Consultation, (consultation) => consultation.messages)
  @JoinColumn({ name: 'consultation_id' })
  consultation: Consultation;

  @Column({ type: 'uuid' })
  consultationId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sender_user_id' })
  senderUser: User;

  @Column({ type: 'uuid', nullable: true })
  senderUserId: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'sender_doctor_id' })
  senderDoctor: Employee;

  @Column({ type: 'uuid', nullable: true })
  senderDoctorId: string;
}
