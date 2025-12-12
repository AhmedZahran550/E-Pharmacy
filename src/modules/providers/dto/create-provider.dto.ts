import { IsLocalizedName } from '@/common/decorators/localized-name.decorator';
import { LocalizedName } from '@/common/models/localized.name';
import { IsOptional, IsBoolean } from 'class-validator';

export class CreateProviderDto {
  constructor(partial?: Partial<CreateProviderDto>) {
    Object.assign(this, partial);
  }

  @IsLocalizedName()
  localizedName: LocalizedName;

  @IsOptional()
  address?: LocalizedName;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
