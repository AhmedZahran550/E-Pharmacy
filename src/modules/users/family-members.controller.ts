import { Paginate, QueryOptions } from '@/common/query-options';
import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { Role } from '@/modules/auth/role.model';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { AuthUser } from '@/modules/auth/decorators/auth-user.decorator';
import { AuthUserDto } from '@/modules/auth/dto/auth-user.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { FamilyMembersService } from './family-members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';

@ApiTags('Family Members')
@Controller('family-members')
@Roles(Role.USER, Role.APP_USER)
export class FamilyMembersController {
  constructor(private familyMembersService: FamilyMembersService) {}

  @Post()
  @ApiOperation({
    summary: 'Add family member',
    description: 'Add a new family member to user account',
  })
  @ApiResponse({ status: 201, description: 'Family member added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async addFamilyMember(
    @AuthUser() user: AuthUserDto,
    @Body() dto: CreateMemberDto,
  ) {
    return this.familyMembersService.addFamilyMember(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List family members',
    description: 'Get paginated list of user family members',
  })
  @ApiResponse({
    status: 200,
    description: 'Family members retrieved successfully',
  })
  async listFamilyMembers(
    @AuthUser() user: AuthUserDto,
    @Paginate() query: QueryOptions,
  ) {
    return this.familyMembersService.listFamilyMembers(user.id, query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update family member',
    description: 'Update family member information',
  })
  @ApiParam({ name: 'id', description: 'Family member UUID' })
  @ApiResponse({
    status: 200,
    description: 'Family member updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Family member not found' })
  async updateFamilyMember(
    @AuthUser() user: AuthUserDto,
    @UuidParam('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFamilyMemberDto,
  ) {
    return this.familyMembersService.updateFamilyMember(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete family member',
    description: 'Remove family member from account',
  })
  @ApiParam({ name: 'id', description: 'Family member UUID' })
  @ApiResponse({
    status: 200,
    description: 'Family member deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Family member not found' })
  async deleteFamilyMember(
    @AuthUser() user: AuthUserDto,
    @UuidParam('id', ParseUUIDPipe) id: string,
  ) {
    return this.familyMembersService.deleteFamilyMember(user.id, id);
  }
}
