import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { ROLES_KEY } from './decorators/roles.decorator';
import { Role } from './role.model';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [Role.ADMIN];

    const isPublic = this.reflector.getAllAndOverride<Role[]>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    if(user?.roles?.includes(Role.ADMIN) || user?.roles?.includes(Role.SUPER_ADMIN)){
      return true;
    }
    return requiredRoles.some((role) => !!user?.roles?.includes(role));
  }
}
