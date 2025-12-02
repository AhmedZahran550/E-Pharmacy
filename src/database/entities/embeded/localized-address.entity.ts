import { Column } from 'typeorm';
import { ColumnEmbeddedOptions } from 'typeorm/decorator/options/ColumnEmbeddedOptions';

interface LocalizedAddressColumnOptions extends ColumnEmbeddedOptions {
  nullable?: boolean;
}

export interface LocalizedAddress {
  en: string;
  ar: string;
}

export class RequiredLocalizedAddress implements LocalizedAddress {
  @Column({ name: 'address_en', nullable: false })
  en: string;

  @Column({ name: 'address_ar', nullable: false })
  ar: string;
}

export class NullableLocalizedAddress implements LocalizedAddress {
  @Column({ name: 'address_en', nullable: true })
  en: string;

  @Column({ name: 'address_ar', nullable: true })
  ar: string;
}

export function LocalizedAddressColumn(
  options: LocalizedAddressColumnOptions = { prefix: false, nullable: false },
) {
  return options.nullable
    ? Column(() => NullableLocalizedAddress, options)
    : Column(() => RequiredLocalizedAddress, options);
}
