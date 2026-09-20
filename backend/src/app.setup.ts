import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export function configureApplication(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_ORIGIN'),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}
