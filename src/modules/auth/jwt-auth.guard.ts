import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { AuthUserDto } from './dto/auth-user.dto';
import { ErrorCodes } from '@/common/error-codes';
import { Policy } from './policies.types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private config: ConfigService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      // 💡 See this condition
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_TOKEN,
        property: 'token',
      });
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.get('jwt.accessToken.secret'),
      });
      if (payload.policies && payload.policies?.length > 0) {
        payload.policies = this.deserializePolicies(payload.policies);
      }
      const user: any = {
        ...payload,
        id: payload.sub,
      };
      request['user'] = user as AuthUserDto;
    } catch (error) {
      console.error(error);
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException({
          code: ErrorCodes.TOKEN_EXPIRED,
          message: 'Token has expired',
        });
      }
      throw new UnauthorizedException({
        code: ErrorCodes.INVALID_TOKEN,
        message: error.message,
      });
    }
    return true;
    // return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Deserializes compact policy strings back into Policy objects.
   */
  private deserializePolicies(serialized: string[]): Policy[] {
    if (!serialized) return [];

    const reverseActionMap: Record<string, string> = {
      g: 'get',
      l: 'list',
      c: 'create',
      u: 'update',
      d: 'delete',
      m: 'manage',
    };

    return serialized
      .map((item) => {
        const [subject, actionsStr] = item?.split(':');
        if (!subject || !actionsStr) return null;
        const actions = actionsStr
          .split(',')
          .map((abbrev) => reverseActionMap[abbrev] || abbrev);

        return {
          subject,
          actions,
        };
      })
      .filter((policy) => policy !== null) as Policy[];
  }
}
