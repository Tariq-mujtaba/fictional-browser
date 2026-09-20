import { getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Model } from 'mongoose';
import { Visit } from '../src/browsing/schemas/visit.schema.js';
import { Person } from '../src/people/schemas/person.schema.js';
import { SeedModule } from '../src/seed/seed.module.js';
import { SeedService } from '../src/seed/seed.service.js';
import { Site } from '../src/sites/schemas/site.schema.js';

describe('deterministic seed (e2e)', () => {
  let moduleFixture: TestingModule;
  let seedService: SeedService;
  let personModel: Model<Person>;
  let siteModel: Model<Site>;
  let visitModel: Model<Visit>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [SeedModule],
    }).compile();

    seedService = moduleFixture.get(SeedService);
    personModel = moduleFixture.get(getModelToken(Person.name));
    siteModel = moduleFixture.get(getModelToken(Site.name));
    visitModel = moduleFixture.get(getModelToken(Visit.name));
  });

  it('replaces the database with identical data on every run', async () => {
    const firstSummary = await seedService.run();
    const firstSnapshot = await readSnapshot();

    const secondSummary = await seedService.run();
    const secondSnapshot = await readSnapshot();

    expect(firstSummary).toEqual({
      database: 'fictional_web_test',
      people: 4,
      sites: 10,
      visits: 24,
    });
    expect(secondSummary).toEqual(firstSummary);
    expect(secondSnapshot).toEqual(firstSnapshot);
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  async function readSnapshot(): Promise<unknown> {
    const [people, sites, visits] = await Promise.all([
      personModel.find().sort({ _id: 1 }).lean().exec(),
      siteModel.find().sort({ _id: 1 }).lean().exec(),
      visitModel.find().sort({ _id: 1 }).lean().exec(),
    ]);

    return JSON.parse(JSON.stringify({ people, sites, visits })) as unknown;
  }
});
