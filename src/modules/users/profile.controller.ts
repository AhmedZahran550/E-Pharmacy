import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/role.model';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import fileInterceptorOptions from '@/common/interceptors/file-interceptor-options';
import { FileRequiredPipe } from '@/common/pipes/file-required.pipe';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { ProfileService } from './profile.service';
import { UsersService } from './users.service';
import { ProfileNotificationsDto } from './dto/profile-notifications.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@ApiTags('Profile')
@Controller('profile')
@Roles(Role.USER, Role.APP_USER)
export class ProfileController {
  constructor(
    private usersService: UsersService,
    private profileService: ProfileService,
  ) {}
  @Get()
  getProfile(@AuthUser() user: AuthUserDto) {
    return this.profileService.getUserProfile(user.id);
  }

  @Patch()
  updateProfile(@AuthUser() user: AuthUserDto, @Body() body: UpdateUserDto) {
    return this.profileService.updateProfile(user, body);
  }

  @UseInterceptors(FileInterceptor('image', fileInterceptorOptions))
  @Patch('photo')
  async uploadFile(
    @UploadedFile(FileRequiredPipe) file: Express.Multer.File,
    @AuthUser() user: AuthUserDto,
  ) {
    await this.profileService.updateProfilePhoto(file, user.id);
  }

  @Delete()
  public async deleteAccount(@AuthUser() user: AuthUserDto) {
    return this.usersService.softDelete(user.id);
  }

  @Post('notifications')
  public async getProfilePhoto(
    @AuthUser() profileNotificationsDto: ProfileNotificationsDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.profileService.toggleNotifications(
      user.id,
      profileNotificationsDto,
    );
  }

  @Patch('preferences')
  public async updatePreferences(
    @AuthUser() user: AuthUserDto,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return this.profileService.updateUserPreferences(
      user.id,
      updatePreferencesDto,
    );
  }

  @Patch('preferences/language')
  public async updateLanguage(
    @AuthUser() user: AuthUserDto,
    @Body('language') language: string,
  ) {
    return this.profileService.updateUserPreferences(user.id, { language });
  }

  @Patch('preferences/notifications')
  public async updateNotificationPreferences(
    @AuthUser() user: AuthUserDto,
    @Body()
    notificationSettings: {
      pushNotificationsEnabled?: boolean;
      emailNotificationsEnabled?: boolean;
    },
  ) {
    return this.profileService.updateUserPreferences(
      user.id,
      notificationSettings,
    );
  }
}
