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
import { GoogleMapsService } from './google-maps.service';
import { PlacesNearbyRequest } from '@googlemaps/google-maps-services-js';
import { GooglePlacesNearbySearchDto } from './dto/place.dto';

@Roles(Role.SYSTEM_USER)
@Policies({ subject: Subject.branches })
@Controller('admin/branches')
export class AdminBranchesController {
  constructor(
    private readonly branchesService: BranchesService,
    private readonly uploadService: UploadService,
    private googleMapsService: GoogleMapsService,
  ) {}

  @Get('google')
  async findNearbyFromGoogle(@Query() param: GooglePlacesNearbySearchDto) {
    return this.googleMapsService.findNearbyMedicalPlaces(param);
  }

  @Post()
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ApiQuery(CreateBranchDto, BRANCHES_PAGINATION_CONFIG)
  findAll(@Paginate() query: QueryOptions) {
    return this.branchesService.findAll(query);
  }

  @Get('total-count')
  findBranchCount() {
    return this.branchesService.getTotal();
  }

  @Get(':id')
  findOne(@UuidParam() id: string) {
    return this.branchesService.findById(id);
  }

  @Patch(':id')
  update(@UuidParam() id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  remove(@UuidParam() id: string) {
    return this.branchesService.delete(id);
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
