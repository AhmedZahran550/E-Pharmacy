import {
  PrimaryGeneratedColumn
} from 'typeorm';
import { Metadata, MetadataColumn } from './embeded/metadata.entity';
import { MetadataEntity } from './metadata.entity';

export abstract class BaseEntity<T = {}> extends MetadataEntity<T> {
  // assign object via the constructor
  constructor(obj?: Partial<T>) {
    super(obj);
    obj && Object.assign(this, obj);
  }
  @PrimaryGeneratedColumn('uuid')
  id?: string;
}
