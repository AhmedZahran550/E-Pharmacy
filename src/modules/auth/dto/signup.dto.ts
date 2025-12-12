import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import constants from '@/common/constants';

export class SignUpDto extends CreateUserDto {

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/)
  otp: string;

  @IsOptional()
  @IsBoolean()
  agreeOnTerms: boolean;
}
