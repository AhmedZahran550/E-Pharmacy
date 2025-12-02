import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUserDto } from '../dto/auth-user.dto';
import { ErrorCodes } from '@/common/error-codes';
import { Role } from '../role.model';

@Injectable()
export class BranchAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUserDto;
    const branchId = request.params.branchId;

    if (
      !user.branchId ||
      !branchId ||
      user.roles.includes(Role.PROVIDER_ADMIN)
    ) {
      return true;
    }

    if (user.branchId !== branchId) {
      throw new ForbiddenException({
        message: 'You do not have access to this branch',
        code: ErrorCodes.BRANCHE_ACCESS_DENIED,
      });
    }

    return true;
  }
}
