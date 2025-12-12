import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { GCStorageService } from './gc-storage.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [StorageService, GCStorageService, CacheService],
  exports: [StorageService, GCStorageService, CacheService],
})
export class SharedModule {}
