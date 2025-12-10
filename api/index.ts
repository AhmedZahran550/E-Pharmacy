import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app-setup';

export default async function handler(req, res) {
  const app = await NestFactory.create(AppModule);
  await setupApp(app);
  await app.init();
  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
}
