import 'module-alias/register';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { MetadataStorage, getFromContainer } from 'class-validator';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { setupApp } from './app-setup';
import { AppModule } from './app.module';

export const GLOBAL_PREFIX = 'api';
export const PORT = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await setupApp(app); // seperate app setup function for better testability in e2e tests (e2e.setup.ts)
  app.setGlobalPrefix(GLOBAL_PREFIX);

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };

  const config = new DocumentBuilder()
    .setTitle('pharmacy API Specs')
    .setDescription('pharmacy API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config, options);
  const metadata = (getFromContainer(MetadataStorage) as any)
    .validationMetadatas;
  document.components.schemas = Object.assign(
    {},
    document.components.schemas || {},
    validationMetadatasToSchemas(metadata),
  );

  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      docExpansion: 'none', // This collapses all the resources by default
    },
  });
  await app.listen(PORT);
}

bootstrap();
