import { IsOptional, IsString } from 'class-validator';
import { IMetadata } from '@/database/entities/embeded/metadata.entity';

export class MetadataDto implements IMetadata {
  @IsOptional()
  @IsString()
  createdBy?: string;
}
