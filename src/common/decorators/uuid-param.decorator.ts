import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common';

export const UuidParam = createParamDecorator(
  (data: string = 'id', ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return new ParseUUIDPipe().transform(request.params[data], { type: 'param', data });
  },
);