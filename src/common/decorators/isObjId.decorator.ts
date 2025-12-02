// src/decorators/validate-user.decorator.ts
import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsObject, IsString, IsUUID, ValidateNested } from 'class-validator';

export class UUIDObject {
  @IsUUID()
  id: string;
}
export class IDObject {
  @IsString() 
  id: string;
}
export function IsUUIDObj() {
  return applyDecorators(
    ValidateNested({ each: true }),
    IsObject(),
    Type(() => UUIDObject),
  );
}
export function IsIDObj() {
  return applyDecorators(
    ValidateNested({ each: true }),
    IsObject(),
    Type(() => IDObject),
  );
}
