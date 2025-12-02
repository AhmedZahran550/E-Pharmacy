import { Module } from '@nestjs/common';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { UploadService } from './upload-branches.service';
import { AdminBranchesController } from './admin-branches.controller';
import { ProviderBranchesController } from './provider-branch.controller';
import { CustomerBranchesController } from './customer-branch.controller';
import { AdminProviderBranchesController } from './admin-provider-branches.controller';
import { ProviderBranchAvailabilityController } from './provider-branch-availability.controller';
import { AdminProviderBranchAvailabilityController } from './admin-branch-availability.controller';
import { BranchAvailabilityService } from './branch-availability.service';
import { GoogleMapsService } from './google-maps.service';

@Module({
  controllers: [
    BranchesController,
    AdminBranchesController,
    ProviderBranchesController,
    CustomerBranchesController,
    AdminProviderBranchesController,
    ProviderBranchAvailabilityController,
    AdminProviderBranchAvailabilityController,
  ],
  providers: [
    BranchesService,
    UploadService,
    BranchAvailabilityService,
    GoogleMapsService,
  ],
  exports: [BranchesService],
})
export class BranchesModule {}
