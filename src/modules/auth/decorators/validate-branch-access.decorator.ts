import { UseGuards, applyDecorators } from '@nestjs/common';
import { BranchAccessGuard } from '../guards/branch-access.guard';

export function ValidateBranchAccess() {
  return applyDecorators(UseGuards(BranchAccessGuard));
}
