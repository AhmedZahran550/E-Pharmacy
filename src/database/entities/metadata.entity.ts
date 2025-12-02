import {
  PrimaryGeneratedColumn
} from 'typeorm';
import { Metadata, MetadataColumn } from './embeded/metadata.entity';

export abstract class MetadataEntity<T = {}> {
  // assign object via the constructor
  constructor(obj?: Partial<T>) {
    obj && Object.assign(this, obj);
  }

  @MetadataColumn()
  metadata?: Metadata;
}
