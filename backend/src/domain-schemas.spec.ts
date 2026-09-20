import { VisitSchema } from './browsing/schemas/visit.schema.js';
import { PersonSchema } from './people/schemas/person.schema.js';
import { SiteSchema } from './sites/schemas/site.schema.js';

describe('domain schema indexes', () => {
  it('declares the unique person name index', () => {
    expect(PersonSchema.indexes()).toEqual(
      expect.arrayContaining([
        [{ name: 1 }, expect.objectContaining({ unique: true })],
      ]),
    );
  });

  it('declares unique address and full-text site indexes', () => {
    expect(SiteSchema.indexes()).toEqual(
      expect.arrayContaining([
        [{ address: 1 }, expect.objectContaining({ unique: true })],
        [{ title: 'text', searchText: 'text' }, expect.any(Object)],
      ]),
    );
  });

  it('declares the per-person reverse-chronological visit index', () => {
    expect(VisitSchema.indexes()).toEqual(
      expect.arrayContaining([
        [{ personId: 1, visitedAt: -1, _id: -1 }, expect.any(Object)],
      ]),
    );
  });
});
