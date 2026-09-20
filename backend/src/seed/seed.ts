import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module.js';
import { SeedService } from './seed.service.js';

const logger = new Logger('Seed');

async function seed(): Promise<void> {
  const context = await NestFactory.createApplicationContext(SeedModule);

  try {
    const summary = await context.get(SeedService).run();
    logger.log(
      `Seeded ${summary.database}: ${summary.people} people, ${summary.sites} sites, ${summary.visits} visits`,
    );
  } finally {
    await context.close();
  }
}

seed().catch((error: unknown) => {
  logger.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
