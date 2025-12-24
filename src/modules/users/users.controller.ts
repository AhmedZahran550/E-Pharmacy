import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { Paginate, QueryOptions } from '@/common/query-options';
import { Controller, Get, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users',
    description: 'Get paginated list of all users',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Paginate() query: QueryOptions) {
    return this.usersService.findAll(query);
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Get user',
    description: 'Retrieve a specific user by ID',
  })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@UuidParam('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.findById(userId);
  }
}
