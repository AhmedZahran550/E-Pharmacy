import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/role.model';
import { ProfileService } from './profile.service';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { MedicalProfileService } from './medical-profile.service';

@ApiTags('Branch Medical Profile')
@Controller('branch/users')
@Roles(Role.PROVIDER_ADMIN, Role.PROVIDER_USER) // Applying to provider admins and users (employees)
export class EmployeeMedicalProfileController {
  constructor(private readonly medicalProfileService: MedicalProfileService) {}

  @Get(':userId/medical-profile')
  async getMedicalProfile(
    @Param('userId') userId: string,
    @AuthUser() user: AuthUserDto,
  ) {
    // Note: Add logic here to verify if the employee has access to this user
    // if strictly needed (e.g., same branch/provider).
    // For now, assuming employees can view any user's profile if they have the ID,
    // or rely on business logic in service if needed.
    const profile = await this.medicalProfileService.getMedicalProfile(userId);
    return profile;
  }
}
