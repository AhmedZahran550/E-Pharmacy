// custom-body.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AppBody = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const body = request.body;

  // Assuming the user information is stored in request.user
  // and you want to set the userId as createdBy
  if (request.user) {
    body.metadata = {
        ...body.metadata,
        createdBy: request.user.id
    }
  }

  return body;
});