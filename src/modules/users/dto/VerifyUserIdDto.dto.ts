import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyUserIdDto {
  @IsNotEmpty()
  @IsString()
  identityId: string;

  userId: string;
}
