import { PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-item.dto';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
