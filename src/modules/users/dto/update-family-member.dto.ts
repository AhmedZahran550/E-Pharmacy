import { PartialType } from '@nestjs/swagger';
import { CreateMemberDto } from './create-member.dto';

export class UpdateFamilyMemberDto extends PartialType(CreateMemberDto) {}
