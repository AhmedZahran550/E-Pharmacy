import { AuthUserDto } from "@/modules/auth/dto/auth-user.dto";
import { IsObject, IsOptional } from "class-validator";

export class SessionDto {
  @IsOptional()
  @IsObject()
  metadata?: any;
}