import {
  Controller,
  Patch,
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
import { EmployeesService } from './employees.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';

@ApiTags('Doctors - Profile')
@Controller('doctors/profile')
@Roles(Role.PROVIDER_DOCTOR, Role.PROVIDER_USER)
export class DoctorsProfileController {
  constructor(private readonly employeesService: EmployeesService) {}

  @UseInterceptors(FileInterceptor('image', fileInterceptorOptions))
  @Patch('photo')
  @ApiOperation({
    summary: 'Upload doctor profile photo',
    description: 'Upload or update doctor profile photo',
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
  async uploadPhoto(
    @UploadedFile(FileRequiredPipe) file: Express.Multer.File,
    @AuthUser() user: AuthUserDto,
  ) {
    return await this.employeesService.updateEmployeePhoto(file, user.id);
  }
}
