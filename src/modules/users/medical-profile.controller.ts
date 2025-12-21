import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/role.model';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { ProfileService } from './profile.service';
import { CreateMedicalProfileDto } from './dto/create-medical-profile.dto';
import { UpdateMedicalProfileDto } from './dto/update-medical-profile.dto';
import { MedicalProfileService } from './medical-profile.service';

@ApiTags('Medical Profile')
@Controller('profile/medical')
@Roles(Role.USER, Role.APP_USER)
export class MedicalProfileController {
  constructor(private medicalProfileService: MedicalProfileService) {}

  // @Post()
  // async createMedicalProfile(
  //   @AuthUser() user: AuthUserDto,
  //   @Body() createMedicalProfileDto: CreateMedicalProfileDto,
  // ) {
  //   const profile = await this.medicalProfileService.createMedicalProfile(
  //     user.id,
  //     createMedicalProfileDto,
  //   );
  //   return profile;
  // }

  @Get()
  async getMedicalProfile(@AuthUser() user: AuthUserDto) {
    const profile = await this.medicalProfileService.getMedicalProfile(user.id);
    return profile;
  }

  @Patch()
  async updateMedicalProfile(
    @AuthUser() user: AuthUserDto,
    @Body() updateMedicalProfileDto: UpdateMedicalProfileDto,
  ) {
    const profile = await this.medicalProfileService.updateMedicalProfile(
      user.id,
      updateMedicalProfileDto,
    );
    return profile;
  }

  @Delete()
  async deleteMedicalProfile(@AuthUser() user: AuthUserDto) {
    await this.medicalProfileService.deleteMedicalProfile(user.id);
    return { success: true };
  }
}
