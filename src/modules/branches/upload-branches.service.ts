import { ErrorCodes } from '@/common/error-codes';
import { Branch } from '@/database/entities/branch.entity';
import { City } from '@/database/entities/city.entity';
import { Governorate } from '@/database/entities/governorate.entity';
import { ProviderSpeciality } from '@/database/entities/provider-speciality.entity';
import { ProviderType } from '@/database/entities/provider-type.entity';
import { Provider } from '@/database/entities/provider.entity';
import { Speciality } from '@/database/entities/speciality.entity';
import { UploadBranchesConfigDto } from '@/modules/branches/dto/upload-branches.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parse } from 'csv-parse/sync';
import { Repository } from 'typeorm';

const containsDashAndSlashRegex = /^(?=.*\/)(?=.*-).+$/;

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(Provider)
    private providerRepository: Repository<Provider>,
    @InjectRepository(Governorate)
    private governorateRepository: Repository<Governorate>,
    @InjectRepository(City)
    private cityRepository: Repository<City>,
    @InjectRepository(ProviderType)
    private providerTypeRepository: Repository<ProviderType>,
    @InjectRepository(Speciality)
    private specialityRepository: Repository<Speciality>,
    @InjectRepository(ProviderSpeciality)
    private ProviderSpecialityRepository: Repository<ProviderSpeciality>,
  ) {}

  async processCSVFiles(
    files: Express.Multer.File[],
    config: UploadBranchesConfigDto,
  ): Promise<any> {
    const results = [];
    if (config.onlyOnRows && files.length > 1) {
      throw new BadRequestException({
        message: 'Only one file is allowed when onlyOnRows is provided',
      });
    }
    for (const file of files) {
      const result = await this.processCSV(file, config);
      result.file = file.originalname;
      results.push(result);
    }
    return results;
  }
  async processCSV(
    file: Express.Multer.File,
    config: UploadBranchesConfigDto,
  ): Promise<any> {
    try {
      console.log('Processing CSV file');
      if (!file) {
        throw new BadRequestException({
          message: 'File is not provided',
          code: ErrorCodes.FILE_NOT_PROVIDED,
        });
      }

      const content = this.getContent(file);
      const records = parse(content, {
        delimiter: ',',
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      const warnings = [];
      const errors = [];

      const providers = await this.providerRepository.find({
        relations: ['type'],
      });
      const providerTypes = await this.providerTypeRepository.find();
      const governorates = await this.governorateRepository.find({
        relations: ['cities'],
      });
      const specialities = await this.specialityRepository.find();

      for (let index = 0; index < records.length; index++) {
        if (config.onlyOnRows && !config.onlyOnRows.includes(index + 1)) {
          continue;
        }
        const row = records[index];
        const recordIndex = index + 1;

        try {
          if (!row['Name'] || !row['اسم']) {
            errors.push({
              code: 'NAME_MISSING',
              data: row,
              index: recordIndex,
            });
            continue;
          }
          const providerType = await this.getType(row, providerTypes);

          let provider: Provider = this.getProviderByName(row, providers);
          if (!provider) {
            if (config.createProviderIfNotExist) {
              provider = await this.createProvider(
                row,
                providers,
                providerType,
              );
            } else {
              errors.push({
                code: 'PROVIDER_NOT_FOUND',
                message: `Provider not found: ${row['Name']} - ${row['اسم']}`,
                data: row,
                index: recordIndex,
              });
              continue;
            }
          }

          const city = await this.getOrCreateCityByName(row, governorates);

          const branch = await this.addBranch({
            row,
            provider,
            city,
          });

          // if type clinic:
          // add specilality to provider_speciality
          if (provider.type.code.toUpperCase() === 'CLINIC') {
            const speciality = await this.getProviderSpecialty(
              row,
              specialities,
            );

            const providerSpecialty =
              await this.ProviderSpecialityRepository.findOne({
                where: {
                  provider: { id: provider.id },
                  speciality: { id: speciality.id },
                },
              });
            if (!providerSpecialty) {
              await this.ProviderSpecialityRepository.save({
                provider: { id: provider.id },
                speciality: { id: speciality.id },
                isActive: true,
              });
            }
          }
        } catch (error) {
          console.error(error);
          errors.push({
            code: 'ERROR',
            message: `Error while adding: ${row['Name']} - ${row['اسم']}`,
            error: error.message,
            data: row,
            index: recordIndex,
          });
        }
      }
      const processedCount = config.onlyOnRows
        ? config.onlyOnRows.length
        : records.length;
      return {
        message:
          errors.length === 0
            ? 'File processed and data saved successfully'
            : `File processed with ${errors.length} errors`,
        totalRecords: records.length,
        successCount: processedCount - errors.length,
        warningCount: warnings.length,
        errorCount: errors.length,
        errors,
        warnings,
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException({
        message: 'Error processing TSV file: ' + error.message,
        code: ErrorCodes.TSV_PROCESSING_ERROR,
      });
    }
  }
  private async getType(
    row: any,
    providerTypes: ProviderType[],
  ): Promise<ProviderType> {
    const typeNameEn = row['Type'];
    let providerType = providerTypes.find(
      (pt) => pt.code.toLowerCase() === typeNameEn.trim().toLowerCase(),
    );
    if (!providerType) {
      throw new BadRequestException({
        message: 'Provider type not found: ' + typeNameEn,
        code: ErrorCodes.PROVIDER_NOT_FOUND,
      });
    }
    return providerType;
  }
  private async getProviderSpecialty(
    row: any,
    specialities: Speciality[],
  ): Promise<Speciality> {
    const specialtyNameEn = row['Speciality'];
    let specialty = specialities.find(
      (sp) =>
        sp.localizedName.en.toLowerCase() ===
        specialtyNameEn.trim().toLowerCase(),
    );
    if (!specialty) {
      throw new BadRequestException({
        message: 'Provider specialty not found: ' + specialtyNameEn,
        code: ErrorCodes.SPECIALITY_NOT_FOUND,
      });
    }
    return specialty;
  }

  private getProviderByName(row: any, providers: Provider[]) {
    const { providerNameEn, providerNameAr } = this.getNames(row);
    let provider = providers.find(
      (p) =>
        p.localizedName.ar.toLowerCase() ===
        providerNameAr.trim().toLowerCase(),
    );
    return provider;
  }

  private async createProvider(
    row: any,
    providers: Provider[],
    providerType: ProviderType,
  ) {
    const { providerNameEn, providerNameAr } = this.getNames(row);
    const providerEnitty = this.providerRepository.create({
      localizedName: {
        en: providerNameEn,
        ar: providerNameAr,
      },
      type: providerType,
    });
    const savedProvider = await this.providerRepository.save(providerEnitty);
    providers.push(savedProvider);
    return savedProvider;
  }

  // private async getSpesialities(row: any, providerType: ProviderType) {
  //   const specialities = [];
  //   const specialitiesEn = row['Speciality']
  //     ?.replace(/[/]+/g, ',')
  //     .split(',')
  //     .map((s) => s.trim());
  //   const specialitiesAr = row['تخصص']
  //     ?.replace(/[/]+/g, ',')
  //     .split(',')
  //     .map((s) => s.trim());

  //   for (let i = 0; i < specialitiesEn.length; i++) {
  //     const specialityEn = specialitiesEn[i];
  //     const specialityAr = specialitiesAr[i];
  //     if (specialityEn === undefined || specialityAr === undefined) {
  //       console.log('Speciality is missing', specialitiesEn, specialitiesAr);
  //       throw new Error('Speciality is missing:' + row['Name']);
  //     }
  //     let speciality = providerType.specialities?.find(
  //       (sp) =>
  //         sp.localizedName.en.toLowerCase() === specialityEn.toLowerCase() ||
  //         sp.localizedName.ar.toLowerCase() === specialityAr.toLowerCase(),
  //     );

  //     if (!speciality) {
  //       speciality = this.specialityRepository.create({
  //         localizedName: {
  //           en: specialityEn,
  //           ar: specialityAr,
  //         },
  //         type: providerType,
  //       });
  //       speciality = await this.specialityRepository.save(speciality);
  //       // if (!providerType.specialities) {
  //       //   providerType.specialities = [];
  //       // }
  //       // providerType.specialities.push(speciality);
  //     }
  //     specialities.push(speciality);
  //   }
  //   return specialities;
  // }

  private getNames(row: any): { providerNameEn: any; providerNameAr: any } {
    let providerNameEn = row['Name'] as string;
    let providerNameAr = row['اسم'] as string;

    const firstDashIndex = providerNameEn.indexOf('-');
    const lastDashIndex = providerNameEn.lastIndexOf('-');
    let nameEn;
    let nameAr = providerNameAr.replace('"', '').trim();
    if (firstDashIndex === -1) {
      // No dash present, return the string as is
      nameEn = providerNameEn;
    } else if (firstDashIndex === lastDashIndex) {
      // Only one dash, split by the first dash
      nameEn = providerNameEn.split('-')[0];
    } else {
      // More than one dash, split by the last dash
      nameEn = providerNameEn.substring(0, lastDashIndex);
    }

    return {
      providerNameEn: nameEn.replace('"', '').trim(),
      providerNameAr: nameAr,
    };
  }

  private async getOrCreateCityByName(row: any, governorates: Governorate[]) {
    const cityName = row['City']?.trim();
    const governorateName = row['Governorate']?.trim();
    let governorate = governorates.find(
      (c) =>
        c.localizedName.en.toLowerCase() === governorateName?.toLowerCase(),
    );

    if (!governorate) {
      throw new BadRequestException({
        message: 'Governorate not found: ' + governorateName,
        code: ErrorCodes.GOVERNORATE_NOT_FOUND,
      });
    }

    let city = governorate.cities?.find(
      (c) => c.localizedName.en.toLowerCase() === cityName?.toLowerCase(),
    );
    if (!city) {
      city = this.cityRepository.create({
        localizedName: {
          en: row['City'],
          ar: row['مدينة'],
        },
        governorate: {
          id: governorate.id,
        },
      });
      city = await this.cityRepository.save(city);
      if (!governorate.cities) {
        governorate.cities = [];
      }
      governorate.cities.push();
    }
    return city;
  }

  private async addBranch({
    row,
    provider,
    city,
  }: {
    row: any;
    provider: Provider;
    city: City;
  }) {
    const telCol = row['هاتف'];
    let telephones = [telCol];

    if (!containsDashAndSlashRegex.test(telCol)) {
      const telephonesString = telCol?.includes('-')
        ? telCol?.replace(/[\-]+/g, ',')
        : telCol.replace(/[/\-_]+/g, ',');
      telephones = telephonesString.split(',').map((t) => t.trim());
    }

    const branch = this.branchRepository.create({
      localizedName: {
        en: row['Name'],
        ar: row['اسم'],
      },
      address: {
        en: row['Address'],
        ar: row['عنوان'],
      },
      telephones,
      latitude: parseFloat(row['X']),
      longitude: parseFloat(row['Y']),
      provider,
      city: {
        id: city.id,
      },
    });

    // branch.location = {
    //   type: 'Point',
    //   coordinates: [branch.longitude, branch.latitude],
    // };
    const newBranch = await this.branchRepository.save(branch);
    return newBranch;
  }

  private getContent(file: Express.Multer.File): string {
    try {
      const str = file.buffer.toString('utf8');
      const buffer = Buffer.from(str, 'utf-8');
      const decoded = buffer.toString('utf-8');
      return decoded;
    } catch (e) {
      throw new BadRequestException({
        message: 'File content is not valid UTF-8',
        code: ErrorCodes.INVALID_FILE_CONTENT,
      });
    }
  }
}
