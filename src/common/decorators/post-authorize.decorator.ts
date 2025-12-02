import { AuthUserDto } from '@/modules/auth/dto/auth-user.dto';
import { SetMetadata } from '@nestjs/common';

export const POST_AUTHORIZE_KEY = 'post_authorize';

export const PostAuthorize = <T>(
  predicate: (data: T, context: { user: AuthUserDto }) => boolean,
) => SetMetadata(POST_AUTHORIZE_KEY, predicate);
