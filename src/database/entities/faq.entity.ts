import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import {
  LocalizedColumn,
  LocalizedNameColumn,
} from '../localized-column.decorator';
import { BaseEntity } from './base.entity';
import {
  EmbededLocalizedColumn,
  EmbededLocalizedName,
} from './embeded/localized-name.entity';

@Entity({ name: 'faq' })
export class Faq extends BaseEntity {
  @LocalizedColumn()
  question: EmbededLocalizedColumn;

  @LocalizedColumn()
  answer: EmbededLocalizedColumn;

  // Optional slug for client-friendly URLs or identifiers
  @Column({ nullable: true })
  slug?: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Faq, (faq) => faq.subFaqs, {
    nullable: true,
  })
  @JoinColumn()
  parent: Faq;

  @OneToMany(() => Faq, (faq) => faq.parent)
  subFaqs: Faq[];

  @Column({ default: 0 })
  sortOrder: number;
}
