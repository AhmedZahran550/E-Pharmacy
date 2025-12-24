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
import { ApiTags } from '@nestjs/swagger';
import { FamilyMembersService } from './family-members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateFamilyMemberDto } from './dto/update-family-member.dto';

@ApiTags('Family Members')
@Controller('family-members')
@Roles(Role.USER, Role.APP_USER)
export class FamilyMembersController {
  constructor(private familyMembersService: FamilyMembersService) {}

  @Post()
  async addFamilyMember(
    @AuthUser() user: AuthUserDto,
    @Body() dto: CreateMemberDto,
  ) {
    return this.familyMembersService.addFamilyMember(user.id, dto);
  }

  @Get()
  async listFamilyMembers(
    @AuthUser() user: AuthUserDto,
    @Paginate() query: QueryOptions,
  ) {
    return this.familyMembersService.listFamilyMembers(user.id, query);
  }

  @Patch(':id')
  async updateFamilyMember(
    @AuthUser() user: AuthUserDto,
    @UuidParam('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFamilyMemberDto,
  ) {
    return this.familyMembersService.updateFamilyMember(user.id, id, dto);
  }

  @Delete(':id')
  async deleteFamilyMember(
    @AuthUser() user: AuthUserDto,
    @UuidParam('id', ParseUUIDPipe) id: string,
  ) {
    return this.familyMembersService.deleteFamilyMember(user.id, id);
  }
}
