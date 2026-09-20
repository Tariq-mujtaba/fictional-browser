import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApplication } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApplication(app);

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
}
await bootstrap();
