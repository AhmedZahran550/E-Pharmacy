// https://www.youtube.com/watch?v=MSMw6NO2dOo
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
config();

const configService = new ConfigService();

export default new DataSource(
  configService.get('database') as DataSourceOptions,
);
