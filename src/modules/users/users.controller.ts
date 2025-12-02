import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { Paginate, QueryOptions } from '@/common/query-options';
import { Controller, Get, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Paginate() query: QueryOptions) {
    return this.usersService.findAll(query);
  }

  @Get(':userId')
  async findById(@UuidParam('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.findById(userId);
  }
}
