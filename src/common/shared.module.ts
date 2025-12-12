import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { GCStorageService } from './gc-storage.service';
import { CacheService } from './cache.service';
import { CloudinaryService } from './cloudinary.service';

@Global()
@Module({
  providers: [
    StorageService,
    GCStorageService,
    CacheService,
    CloudinaryService,
  ],
  exports: [StorageService, GCStorageService, CacheService, CloudinaryService],
})
export class SharedModule {}
