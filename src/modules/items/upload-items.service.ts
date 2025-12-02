import { ErrorCodes } from '@/common/error-codes';
import {
  Item,
  ItemOrigin,
  ItemType,
  ItemUnit,
} from '@/database/entities/item.entity';
import { SpecialityItem } from '@/database/entities/speciality-item.entity';
import { Speciality } from '@/database/entities/speciality.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parse } from 'csv-parse/sync';
import { Repository } from 'typeorm';

type CsvServiceRow = {
  name_en: string;
  name_ar: string;
  price: number;
  SpecialityEn: string;
  SpecialityAr: string;
};
@Injectable()
export class UploadItemsService {
  constructor(
    @InjectRepository(Item)
    private itemRepository: Repository<Item>,
    @InjectRepository(SpecialityItem)
    private specialityItemRepository: Repository<SpecialityItem>,
    @InjectRepository(Speciality)
    private specialityRepository: Repository<Speciality>,
  ) {}
  async procesServicesCSV(file: Express.Multer.File): Promise<any> {
    try {
      if (!file) {
        throw new BadRequestException({
          message: 'File is not provided',
          code: ErrorCodes.FILE_NOT_PROVIDED,
        });
      }

      const content = file.buffer.toString('utf8');

      // Optionally, validate the UTF-8 content
      if (!this.isValidUTF8(content)) {
        throw new BadRequestException({
          message: 'File content is not valid UTF-8',
          code: ErrorCodes.INVALID_FILE_CONTENT,
        });
      }

      const records = parse(content, {
        delimiter: ',',
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      const warnings = [];
      const errors = [];
      let lastSpeciality: Speciality = null;
      const outputRows: CsvServiceRow[] = [];
      const specialities = await this.specialityRepository.find();
      let isPreviousRowSpeciality = false;
      const notFoundSpecialities = [];
      const rowsWithExtraColumns: any[] = [];

      for (let index = 0; index < records.length; index++) {
        const row = records[index];
        const recordIndex = index + 1;
        const keys = Object.keys(row);
        if (keys.length > 5) {
          rowsWithExtraColumns.push(row);
        }

        try {
          const name_en = row[keys[0]];
          const name_ar = row[keys[1]];
          const price = row[keys[2]];

          const isHeaderRow = price?.trim().toLowerCase() === 'price';

          if (isHeaderRow) {
            continue;
          }

          if (!price || price.trim() === '') {
            let savedSpeicality = specialities.find(
              (s) =>
                s.localizedName.en === name_en &&
                s.localizedName.ar === name_ar,
            );

            lastSpeciality = savedSpeicality;
          } else {
            let itemEntity = await this.itemRepository.findOne({
              where: {
                localizedName: {
                  en: name_en.trim(),
                  ar: name_ar.trim(),
                },
              },
            });
            if (!itemEntity) {
              itemEntity = this.itemRepository.create({
                localizedName: {
                  en: name_en.trim(),
                  ar: name_ar.trim(),
                },
                price: parseFloat(price),
              });
              itemEntity = await this.itemRepository.save(itemEntity);
            }

            const specialityItemEntity = this.specialityItemRepository.create({
              item: itemEntity,
              speciality: lastSpeciality,
            });
            await this.specialityItemRepository.save(specialityItemEntity);
          }
        } catch (error) {
          errors.push({
            code: 'ERROR',
            message: `Error while adding: ${row['Name']} - ${row['اسم']}`,
            error: error.message,
            data: row,
            index: recordIndex,
          });
        }
      }

      return {
        message:
          errors.length === 0
            ? 'File processed and data saved successfully'
            : `File processed with ${errors.length} errors`,
        totalRecords: records.length,
        successCount: records.length - errors.length,
        warningCount: warnings.length,
        errorCount: errors.length,
        errors,
        warnings,
        rowsWithExtraColumns,
        notFoundSpecialities,
        specialities,
        metadata: {
          totalNotFoundSpecialities: notFoundSpecialities.length,
          totalSpecialities: specialities.length,
        },
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException({
        message: 'Error processing TSV file: ' + error.message,
        code: ErrorCodes.INVALID_FILE_CONTENT,
      });
    } finally {
      console.log('Processing CSV file completed');
    }
  }

  async procesPharmacyItemsCSV(file: Express.Multer.File): Promise<any> {
    try {
      const content = file.buffer.toString('utf8');

      // Optionally, validate the UTF-8 content
      if (!this.isValidUTF8(content)) {
        throw new BadRequestException({
          message: 'File content is not valid UTF-8',
          code: ErrorCodes.INVALID_FILE_CONTENT,
        });
      }

      const records = parse(content, {
        delimiter: ',',
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const warnings = [];
      const errors = [];

      const speciality = await this.specialityRepository.findOne({
        where: {
          code: 'PHARMACY',
        },
      });

      if (!speciality) {
        throw new BadRequestException({
          message: 'Speciality not found',
          code: ErrorCodes.SPECIALITY_NOT_FOUND,
        });
      }

      for (let index = 0; index < records.length; index++) {
        const row = records[index];
        const recordIndex = index + 1;
        try {
          const keys = Object.keys(row);
          const name_en = row[keys[0]];
          const name_ar = row[keys[0]];
          const unit = row[keys[1]];
          const originText = row[keys[2]];
          const price = row[keys[3]];

          const units: ItemUnit[] = [];

          const origin: ItemOrigin =
            originText?.toLowerCase === 'IMPORTED'
              ? ItemOrigin.IMPORTED
              : ItemOrigin.LOCAL;

          let itemEntity = await this.itemRepository.findOne({
            where: {
              localizedName: {
                en: name_en.trim(),
                ar: name_ar.trim(),
              },
            },
          });

          if (!itemEntity) {
            itemEntity = this.itemRepository.create({
              localizedName: {
                en: name_en.trim(),
                ar: name_ar.trim(),
              },
              price: parseFloat(price),
              origin,
              units: [unit],
              type: ItemType.PRODUCT,
            });
            itemEntity = await this.itemRepository.save(itemEntity);
          }

          const specialityItemEntity = this.specialityItemRepository.create({
            item: itemEntity,
            speciality,
          });
          await this.specialityItemRepository.save(specialityItemEntity);
        } catch (error) {
          errors.push({
            code: 'ERROR',
            message: `Error while adding: ${row['Name']} - ${row['اسم']}`,
            error: error.message,
            data: row,
            index: recordIndex,
          });
        }
      }

      return {
        message:
          errors.length === 0
            ? 'File processed and data saved successfully'
            : `File processed with ${errors.length} errors`,
        totalRecords: records.length,
        successCount: records.length - errors.length,
        warningCount: warnings.length,
        errorCount: errors.length,
        errors,
        warnings,
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException({
        message: 'Error processing TSV file: ' + error.message,
        code: ErrorCodes.INVALID_FILE_CONTENT,
      });
    } finally {
      console.log('Processing CSV file completed');
    }
  }

  async createSpeciality(specialityRow: any) {
    const specialityEntity = this.specialityRepository.create({
      localizedName: {
        en: specialityRow.name_en.trim(),
        ar: specialityRow.name_ar.trim(),
      },
      notes_ar: specialityRow.notes_ar,
      notes_en: specialityRow.notes_en,
      // index: specialityRow.index,
    });
    const savedSpeicality =
      await this.specialityRepository.save(specialityEntity);
    return savedSpeicality;
  }

  private isValidUTF8(str: string): boolean {
    try {
      const buffer = Buffer.from(str, 'utf-8');
      const decoded = buffer.toString('utf-8');
      return decoded === str;
    } catch (e) {
      return false;
    }
  }
}
