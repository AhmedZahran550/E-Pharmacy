import { ApiQuery } from '@/common/decorators/pagination-query.decorator';
import { UuidParam } from '@/common/decorators/uuid-param.decorator';
import { ErrorCodes } from '@/common/error-codes';
import { multerOptions } from '@/common/multer/multer.config';
import { QueryOptions } from '@/common/query-options';
import { UploadBranchesConfigDto } from '@/modules/branches/dto/upload-branches.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Paginate } from 'nestjs-paginate';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/role.model';
import {
  BRANCHES_PAGINATION_CONFIG,
  BranchesService,
} from './branches.service';
import { NearByBranchDto } from './dto/NearBy-branch.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UploadService } from './upload-branches.service';
import { Policies } from '../auth/decorators/policies.decorator';
import { Subject } from '../auth/policies.types';

@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.branches })
@Controller('admin/providers/:providerId/branches')
export class AdminProviderBranchesController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  create(
    @Body() createBranchDto: CreateBranchDto,
    @UuidParam('providerId') providerId: string,
  ) {
    createBranchDto.provider = {
      id: providerId,
    };
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ApiQuery(CreateBranchDto, BRANCHES_PAGINATION_CONFIG)
  findAll(
    @Paginate() query: QueryOptions,
    @UuidParam('providerId') providerId: string,
  ) {
    return this.branchesService.findByProviderId(providerId, query);
  }

  @Get('total-count')
  findBranchCount(@UuidParam('providerId') providerId: string) {
    return this.branchesService.getTotal({
      where: { provider: { id: providerId } },
    });
  }

  @Get(':id')
  findOne(
    @UuidParam('id') id: string,
    @UuidParam('providerId') providerId: string,
  ) {
    return this.branchesService.findById(id, {
      where: { provider: { id: providerId } },
    });
  }

  @Patch(':id')
  update(
    @UuidParam('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @UuidParam('providerId') providerId: string,
  ) {
    return this.branchesService.update(id, updateBranchDto, {
      where: { provider: { id: providerId } },
    });
  }

  @Delete(':id')
  remove(@UuidParam() id: string, @UuidParam('providerId') providerId: string) {
    return this.branchesService.delete(id, {
      where: { provider: { id: providerId } },
    });
  }

  @Post('csv')
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  async uploadCSV(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() config: UploadBranchesConfigDto,
  ) {
    if (!files) {
      throw new BadRequestException([
        {
          property: 'files',
          code: ErrorCodes.INVALID_FILE,
          message: 'No files uploaded',
        },
      ]);
    }
    return this.uploadService.processCSVFiles(files, config);
  }
}
