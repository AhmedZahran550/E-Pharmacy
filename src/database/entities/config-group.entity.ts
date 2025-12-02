// src/config-group/entities/config-group.entity.ts

import { BaseEntity } from '@/database/entities/base.entity';
import { Config } from '@/database/entities/config.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity()
@Unique(['name', 'environment'])
export class ConfigGroup extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Group name, e.g., "UI Settings"

  @Column({ nullable: true })
  description?: string; // Optional description of the group

  @Column({ nullable: true })
  environment?: string; // Environment identifier, e.g., "development", "production"

  @OneToMany(() => Config, (config) => config.group, { cascade: true })
  configs: Config[]; // List of configurations within the group
}
