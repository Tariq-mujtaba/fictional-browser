import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import type { Connection, Model } from 'mongoose';
import { Visit } from '../browsing/schemas/visit.schema.js';
import { Person } from '../people/schemas/person.schema.js';
import { Site } from '../sites/schemas/site.schema.js';
import { createSeedData } from './seed-data.js';
import { assertSeedDatabaseAllowed } from './seed.guard.js';

export interface SeedSummary {
  database: string;
  people: number;
  sites: number;
  visits: number;
}

@Injectable()
export class SeedService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Person.name) private readonly personModel: Model<Person>,
    @InjectModel(Site.name) private readonly siteModel: Model<Site>,
    @InjectModel(Visit.name) private readonly visitModel: Model<Visit>,
  ) {}

  async run(): Promise<SeedSummary> {
    assertSeedDatabaseAllowed(this.connection.name);

    const data = createSeedData();

    await this.connection.dropDatabase();
    await Promise.all([
      this.personModel.createCollection(),
      this.siteModel.createCollection(),
      this.visitModel.createCollection(),
    ]);
    await Promise.all([
      this.personModel.syncIndexes(),
      this.siteModel.syncIndexes(),
      this.visitModel.syncIndexes(),
    ]);

    await this.personModel.insertMany(data.people);
    await this.siteModel.insertMany(data.sites);
    await this.visitModel.insertMany(data.visits);

    return {
      database: this.connection.name,
      people: data.people.length,
      sites: data.sites.length,
      visits: data.visits.length,
    };
  }
}
