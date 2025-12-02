import { BaseEntity } from '@/database/entities/base.entity';
import { ConfigGroup } from '@/database/entities/config-group.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['key', 'environment', 'group'])
export class Config extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  key: string; // Unique key identifier for the configuration

  @Column('text')
  value: string; // Value of the configuration, stored as text for flexibility

  @Column({ nullable: true })
  description?: string; // Optional description of the configuration

  @Column({ nullable: true })
  environment?: string; // Environment identifier, e.g., "development", "production"

  @ManyToOne(() => ConfigGroup, (group) => group.configs, {
    onDelete: 'CASCADE',
  })
  group: ConfigGroup; // Reference to the associated ConfigGroup
}
