import { type INestApplication } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Connection, Model } from 'mongoose';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApplication } from '../src/app.setup.js';
import { ArrivalMethod } from '../src/browsing/arrival-method.js';
import { Visit } from '../src/browsing/schemas/visit.schema.js';
import { SeedModule } from '../src/seed/seed.module.js';
import { SeedService } from '../src/seed/seed.service.js';
import { Site } from '../src/sites/schemas/site.schema.js';

interface PersonResponse {
  id: string;
  name: string;
}

describe('fictional web API (e2e)', () => {
  let app: INestApplication<App>;
  let appFixture: TestingModule;
  let seedFixture: TestingModule;
  let seedService: SeedService;
  let siteModel: Model<Site>;
  let visitModel: Model<Visit>;

  beforeAll(async () => {
    seedFixture = await Test.createTestingModule({
      imports: [SeedModule],
    }).compile();
    seedService = seedFixture.get(SeedService);

    appFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = appFixture.createNestApplication();
    configureApplication(app);
    await app.init();

    const connection = app.get<Connection>(getConnectionToken());
    if (connection.name !== 'fictional_web_test') {
      throw new Error('E2E tests must use the fictional_web_test database');
    }

    siteModel = app.get(getModelToken(Site.name));
    visitModel = app.get(getModelToken(Visit.name));
  });

  beforeEach(async () => {
    await seedService.run();
  });

  afterAll(async () => {
    await app.close();
    await seedFixture.close();
  });

  describe('GET /people', () => {
    it('returns stable DTOs sorted by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/people')
        .expect(200);

      expect(response.body).toEqual([
        expect.objectContaining({ name: 'Lena Ortiz' }),
        expect.objectContaining({ name: 'Mira Chen' }),
        expect.objectContaining({ name: 'Omar Haddad' }),
        expect.objectContaining({ name: 'Theo Okafor' }),
      ]);

      for (const person of response.body as PersonResponse[]) {
        expect(Object.keys(person).sort()).toEqual(['id', 'name']);
        expect(person.id).toMatch(/^[0-9a-f]{24}$/);
      }
    });
  });

  describe('browse and history', () => {
    it('normalizes a found address and records exactly one visit', async () => {
      const personId = await getPersonId('Mira Chen');
      const countBefore = await visitModel.countDocuments();

      const response = await request(app.getHttpServer())
        .post('/browse')
        .send({
          personId,
          address: '  LANTERN.ZZ  ',
          method: ArrivalMethod.Typed,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        outcome: 'found',
        address: 'lantern.zz',
        site: {
          address: 'lantern.zz',
          title: 'The Lantern Index',
          author: { name: 'Mira Chen' },
        },
      });
      expect(await visitModel.countDocuments()).toBe(countBefore + 1);
      expect(
        await visitModel
          .findOne({ personId, address: 'lantern.zz' })
          .sort({ visitedAt: -1, _id: -1 })
          .lean()
          .exec(),
      ).toMatchObject({ method: ArrivalMethod.Typed, outcome: 'found' });
    });

    it('records repeated not-found arrivals independently', async () => {
      const personId = await getPersonId('Mira Chen');

      for (const method of [ArrivalMethod.Link, ArrivalMethod.Back]) {
        const response = await request(app.getHttpServer())
          .post('/browse')
          .send({ personId, address: 'missing-page.zz', method })
          .expect(201);

        expect(response.body).toEqual({
          outcome: 'not_found',
          address: 'missing-page.zz',
        });
      }

      const visits = await visitModel
        .find({ personId, address: 'missing-page.zz' })
        .sort({ visitedAt: 1, _id: 1 })
        .lean()
        .exec();

      expect(visits).toHaveLength(2);
      expect(visits.map(({ method }) => method)).toEqual([
        ArrivalMethod.Link,
        ArrivalMethod.Back,
      ]);
      expect(visits.every(({ siteId }) => siteId === null)).toBe(true);
    });

    it('records every arrival method', async () => {
      const personId = await getPersonId('Lena Ortiz');

      for (const method of Object.values(ArrivalMethod)) {
        await request(app.getHttpServer())
          .post('/browse')
          .send({ personId, address: 'lantern.zz', method })
          .expect(201);
      }

      const methods = await visitModel.distinct('method', {
        personId,
        address: 'lantern.zz',
      });

      expect(new Set(methods)).toEqual(new Set(Object.values(ArrivalMethod)));
    });

    it('returns newest-first history scoped to one person', async () => {
      const miraId = await getPersonId('Mira Chen');
      const theoId = await getPersonId('Theo Okafor');

      await request(app.getHttpServer())
        .post('/browse')
        .send({
          personId: miraId,
          address: 'mira-only.zz',
          method: ArrivalMethod.History,
        })
        .expect(201);
      await request(app.getHttpServer())
        .post('/browse')
        .send({
          personId: theoId,
          address: 'theo-only.zz',
          method: ArrivalMethod.Search,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/people/${miraId}/history`)
        .expect(200);

      expect(response.body[0]).toMatchObject({
        address: 'mira-only.zz',
        method: ArrivalMethod.History,
        outcome: 'not_found',
        siteId: null,
      });
      expect(
        (response.body as Array<{ address: string }>).some(
          ({ address }) => address === 'theo-only.zz',
        ),
      ).toBe(false);
      expect(
        (response.body as Array<{ visitedAt: string }>).map(({ visitedAt }) =>
          Date.parse(visitedAt),
        ),
      ).toEqual(
        [...(response.body as Array<{ visitedAt: string }>)]
          .map(({ visitedAt }) => Date.parse(visitedAt))
          .sort((left, right) => right - left),
      );
    });

    it('does not write visits for rejected requests', async () => {
      const personId = await getPersonId('Mira Chen');
      const countBefore = await visitModel.countDocuments();

      await request(app.getHttpServer())
        .post('/browse')
        .send({
          personId: '650000000000000000000099',
          address: 'lantern.zz',
          method: ArrivalMethod.Typed,
        })
        .expect(404);
      await request(app.getHttpServer())
        .post('/browse')
        .send({ personId, address: 'https://example.com', method: 'teleport' })
        .expect(400);

      expect(await visitModel.countDocuments()).toBe(countBefore);
      await request(app.getHttpServer())
        .get('/people/not-an-object-id/history')
        .expect(400);
    });
  });

  describe('site publishing', () => {
    it('publishes sanitized HTML and uses the address for a blank title', async () => {
      const authorId = await getPersonId('Omar Haddad');

      const response = await request(app.getHttpServer())
        .post('/sites')
        .send({
          authorId,
          address: '  NEW-PAGE.ZZ ',
          title: '   ',
          html: '<article><h1>A new page</h1><p>Visible prose.</p></article>',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        address: 'new-page.zz',
        title: 'new-page.zz',
        author: { id: authorId, name: 'Omar Haddad' },
      });
      expect(Object.keys(response.body).sort()).toEqual([
        'address',
        'author',
        'html',
        'id',
        'publishedAt',
        'title',
      ]);
    });

    it('rejects duplicate addresses without replacing the original', async () => {
      const authorId = await getPersonId('Omar Haddad');

      await request(app.getHttpServer())
        .post('/sites')
        .send({
          authorId,
          address: 'lantern.zz',
          title: 'Replacement',
          html: '<p>This must not replace the seed.</p>',
        })
        .expect(409);

      const site = await siteModel
        .findOne({ address: 'lantern.zz' })
        .lean()
        .exec();
      expect(site?.title).toBe('The Lantern Index');
      expect(site?.html).not.toContain('must not replace');
    });

    it('stores only allowlisted markup, internal links, and restricted styles', async () => {
      const authorId = await getPersonId('Omar Haddad');
      const rawOnlyMarker = 'raw-script-marker-7291';
      const hostileHtml = `
        <script>${rawOnlyMarker}</script>
        <style>body { display: none }</style>
        <form action="https://evil.example"><input name="secret"><button>Send</button></form>
        <iframe src="https://evil.example"></iframe>
        <img src="https://evil.example/tracker.png" onerror="alert(1)">
        <p onclick="alert(2)" style="color: red; position: fixed; background-image: url(https://evil.example/a.png)">
          Visible nebula prose <strong>survives</strong>.
        </p>
        <a href="https://evil.example">External text remains</a>
        <a href="javascript:alert(3)">Invalid text remains</a>
        <a href=" NEXT-STOP.ZZ ">Internal destination</a>
        <table style="border-collapse: collapse"><tr><th scope="col">Safe table</th><td colspan="2">Cell</td></tr></table>
      `;

      const response = await request(app.getHttpServer())
        .post('/sites')
        .send({
          authorId,
          address: 'hostile.zz',
          title: '<b>Hostile example</b>',
          html: hostileHtml,
        })
        .expect(201);

      const html = response.body.html as string;
      expect(response.body.title).toBe('Hostile example');
      expect(html).toContain('<strong>survives</strong>');
      expect(html).toContain('<table style="border-collapse:collapse">');
      expect(html).toContain('style="color:red"');
      expect(html).toContain('href="next-stop.zz"');
      expect(html).toContain('External text remains');
      expect(html).not.toMatch(
        /<script|<style|<form|<input|<button|<iframe|<img/i,
      );
      expect(html).not.toMatch(
        /onclick|onerror|javascript:|https?:|position:|background-image/i,
      );

      const stored = await siteModel
        .findOne({ address: 'hostile.zz' })
        .lean()
        .exec();
      expect(stored?.html).toBe(html);
      expect(stored?.html).not.toContain(rawOnlyMarker);
      expect(stored?.searchText).toContain('Visible nebula prose survives');
      expect(stored?.searchText).not.toContain(rawOnlyMarker);
    });

    it('validates the author, address, body, and request shape', async () => {
      const authorId = await getPersonId('Omar Haddad');

      await request(app.getHttpServer())
        .post('/sites')
        .send({
          authorId: '650000000000000000000099',
          address: 'orphan.zz',
          html: '<p>Orphaned page</p>',
        })
        .expect(404);
      await request(app.getHttpServer())
        .post('/sites')
        .send({
          authorId,
          address: 'https://example.com',
          html: '<p>Wrong address</p>',
        })
        .expect(400);
      await request(app.getHttpServer())
        .post('/sites')
        .send({
          authorId,
          address: 'empty.zz',
          html: '<script>alert(1)</script>',
          unexpected: true,
        })
        .expect(400);

      expect(
        await siteModel.countDocuments({
          address: { $in: ['orphan.zz', 'empty.zz'] },
        }),
      ).toBe(0);
    });
  });

  describe('full-text search', () => {
    it('finds body-only content and returns metadata without HTML', async () => {
      const response = await request(app.getHttpServer())
        .get('/search')
        .query({ q: 'cardamom' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        address: 'kitchen.zz',
        title: 'The Midnight Kitchen',
        author: { name: 'Omar Haddad' },
      });
      expect(Object.keys(response.body[0]).sort()).toEqual([
        'address',
        'author',
        'id',
        'title',
      ]);
    });

    it('indexes visible sanitized text but not discarded hostile content', async () => {
      const authorId = await getPersonId('Lena Ortiz');

      await request(app.getHttpServer())
        .post('/sites')
        .send({
          authorId,
          address: 'searchable.zz',
          html: '<script>unfindablepayload</script><p>visiblepayload</p>',
        })
        .expect(201);

      const visible = await request(app.getHttpServer())
        .get('/search')
        .query({ q: 'visiblepayload' })
        .expect(200);
      const discarded = await request(app.getHttpServer())
        .get('/search')
        .query({ q: 'unfindablepayload' })
        .expect(200);

      expect(visible.body).toHaveLength(1);
      expect(visible.body[0].address).toBe('searchable.zz');
      expect(discarded.body).toEqual([]);
    });

    it('sorts by relevance and uses address as the stable tie-breaker', async () => {
      const authorId = await getPersonId('Lena Ortiz');
      const sharedPage = {
        authorId,
        title: 'Equal score',
        html: '<p>tieordertoken</p>',
      };

      await request(app.getHttpServer())
        .post('/sites')
        .send({ ...sharedPage, address: 'zeta-result.zz' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/sites')
        .send({ ...sharedPage, address: 'alpha-result.zz' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/sites')
        .send({
          authorId,
          address: 'most-relevant.zz',
          title: 'tieordertoken tieordertoken tieordertoken',
          html: '<p>tieordertoken</p>',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/search')
        .query({ q: 'tieordertoken' })
        .expect(200);

      expect(
        (response.body as Array<{ address: string }>).map(
          ({ address }) => address,
        ),
      ).toEqual(['most-relevant.zz', 'alpha-result.zz', 'zeta-result.zz']);
    });

    it('rejects missing, blank, punctuation-only, and unknown query fields', async () => {
      await request(app.getHttpServer()).get('/search').expect(400);
      await request(app.getHttpServer())
        .get('/search')
        .query({ q: '   ' })
        .expect(400);
      await request(app.getHttpServer())
        .get('/search')
        .query({ q: '---' })
        .expect(400);
      await request(app.getHttpServer())
        .get('/search')
        .query({ q: 'lantern', page: '2' })
        .expect(400);
    });
  });

  async function getPersonId(name: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .get('/people')
      .expect(200);
    const person = (response.body as PersonResponse[]).find(
      (candidate) => candidate.name === name,
    );

    if (person === undefined) {
      throw new Error(`Seeded person not found: ${name}`);
    }

    return person.id;
  }
});
