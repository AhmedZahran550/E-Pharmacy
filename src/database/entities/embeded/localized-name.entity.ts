import { Expose } from 'class-transformer';
import { Column } from 'typeorm';

export class EmbededLocalizedName {
  @Expose()
  @Column({ name: 'name_en', nullable: false })
  en: string;

  @Expose()
  @Column({ name: 'name_ar', nullable: false })
  ar: string;
}
export class NullableEmbededLocalizedName {
  @Expose()
  @Column({ name: 'name_en', nullable: true })
  en: string;

  @Expose()
  @Column({ name: 'name_ar', nullable: true })
  ar: string;
}

export class EmbededLocalizedColumn {
  @Expose()
  @Column({ name: 'en', nullable: false })
  en: string;

  @Expose()
  @Column({ name: 'ar', nullable: false })
  ar: string;
}
export class NullableEmbededLocalizedColumn {
  @Expose()
  @Column({ name: 'en', nullable: true })
  en: string;

  @Expose()
  @Column({ name: 'ar', nullable: true })
  ar: string;
}
