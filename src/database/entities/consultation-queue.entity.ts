import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Consultation } from './consultation.entity';

@Entity('consultation_queue')
export class ConsultationQueue extends BaseEntity {
  @Column({ type: 'int' })
  position: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  enqueuedAt: Date;

  @Column({ type: 'int', default: 0 })
  priority: number; // Higher = more urgent

  // Relationships
  @ManyToOne(() => Consultation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultation_id' })
  consultation: Consultation;

  @Column({ type: 'uuid' })
  consultationId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'uuid' })
  branchId: string;
}
