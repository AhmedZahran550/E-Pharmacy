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
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { ProfileService } from './profile.service';
import { UsersService } from './users.service';
import { ProfileNotificationsDto } from './dto/profile-notifications.dto';
import { RatingDto } from './dto/app-rating.dto';
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

  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
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

  @Post('app-rating')
  async appRating(@Body() ratingDto: RatingDto, @AuthUser() user: AuthUserDto) {
    ratingDto.user = { id: user.id };
    return await this.profileService.appRating(ratingDto);
  }

  @Get('milestones')
  async milestones(@AuthUser() user: AuthUserDto) {
    return await this.profileService.getMilestones(user);
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
