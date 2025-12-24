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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Get user profile',
    description: "Retrieve the authenticated user's profile information",
  })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  getProfile(@AuthUser() user: AuthUserDto) {
    return this.profileService.getUserProfile(user.id);
  }

  @Patch()
  @ApiOperation({
    summary: 'Update profile',
    description: 'Update user profile information',
  })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  updateProfile(@AuthUser() user: AuthUserDto, @Body() body: UpdateUserDto) {
    return this.profileService.updateProfile(user, body);
  }

  @UseInterceptors(FileInterceptor('image', fileInterceptorOptions))
  @Patch('photo')
  @ApiOperation({
    summary: 'Upload profile photo',
    description: 'Upload or update user profile photo',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Profile image file',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Photo uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  async uploadFile(
    @UploadedFile(FileRequiredPipe) file: Express.Multer.File,
    @AuthUser() user: AuthUserDto,
  ) {
    return await this.profileService.updateProfilePhoto(file, user.id);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete account',
    description: 'Soft delete user account',
  })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  public async deleteAccount(@AuthUser() user: AuthUserDto) {
    return this.usersService.softDelete(user.id);
  }

  @Post('notifications')
  @ApiOperation({
    summary: 'Toggle notifications',
    description: 'Enable or disable user notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification settings updated successfully',
  })
  public async toggleNotifications(
    @Body() profileNotificationsDto: ProfileNotificationsDto,
    @AuthUser() user: AuthUserDto,
  ) {
    return this.profileService.toggleNotifications(
      user.id,
      profileNotificationsDto,
    );
  }

  @Patch('preferences')
  @ApiOperation({
    summary: 'Update preferences',
    description: 'Update user preferences settings',
  })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
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
  @ApiOperation({
    summary: 'Update language',
    description: 'Change user interface language preference',
  })
  @ApiResponse({ status: 200, description: 'Language updated successfully' })
  public async updateLanguage(
    @AuthUser() user: AuthUserDto,
    @Body('language') language: string,
  ) {
    return this.profileService.updateUserPreferences(user.id, { language });
  }

  @Patch('preferences/notifications')
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Update push and email notification settings',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification preferences updated successfully',
  })
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
