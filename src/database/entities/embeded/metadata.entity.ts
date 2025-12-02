import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { ColumnEmbeddedOptions } from 'typeorm/decorator/options/ColumnEmbeddedOptions';

export interface IMetadata {
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  version?: number;
}

export class Metadata implements IMetadata {
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt?: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: true,
    select: false,
  })
  updatedAt?: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
    select: false,
  })
  deletedAt?: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ nullable: true })
  deletedBy?: string;

  @VersionColumn({ nullable: true })
  version: number;
}

export function MetadataColumn(
  options: ColumnEmbeddedOptions = { prefix: false },
) {
  return Column(() => Metadata, options);
}
