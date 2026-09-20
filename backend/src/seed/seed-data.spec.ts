import { createSeedData, SIX_SITE_TRAIL } from './seed-data.js';

describe('seed data', () => {
  const data = createSeedData();

  it('contains four people and ten unique sites', () => {
    expect(data.people).toHaveLength(4);
    expect(data.sites).toHaveLength(10);
    expect(new Set(data.sites.map(({ address }) => address)).size).toBe(10);
  });

  it('gives every author more than one site', () => {
    const sitesPerAuthor = Map.groupBy(data.sites, ({ authorId }) =>
      authorId.toHexString(),
    );

    expect(sitesPerAuthor.size).toBe(data.people.length);
    expect(
      [...sitesPerAuthor.values()].every((sites) => sites.length > 1),
    ).toBe(true);
  });

  it('provides an authored link trail six sites deep', () => {
    for (let index = 0; index < SIX_SITE_TRAIL.length - 1; index += 1) {
      const site = data.sites.find(
        ({ address }) => address === SIX_SITE_TRAIL[index],
      );

      expect(site?.html).toContain(`href="${SIX_SITE_TRAIL[index + 1]}"`);
    }
  });

  it('contains links to nonexistent addresses', () => {
    const addresses = new Set(data.sites.map(({ address }) => address));
    const linkedAddresses = data.sites.flatMap(({ html }) =>
      [...html.matchAll(/href="([^"]+\.zz)"/g)].map((match) => match[1]),
    );

    expect(linkedAddresses.some((address) => !addresses.has(address))).toBe(
      true,
    );
  });

  it('contains repeated visits and a visitor to nine existing sites', () => {
    const visitsPerPerson = Map.groupBy(data.visits, ({ personId }) =>
      personId.toHexString(),
    );
    const uniqueFoundSitesPerPerson = [...visitsPerPerson.values()].map(
      (visits) =>
        new Set(
          visits.flatMap(({ siteId }) =>
            siteId === null ? [] : [siteId.toHexString()],
          ),
        ).size,
    );
    const hasRepeat = [...visitsPerPerson.values()].some(
      (visits) =>
        new Set(visits.map(({ address }) => address)).size < visits.length,
    );

    expect(Math.max(...uniqueFoundSitesPerPerson)).toBe(9);
    expect(hasRepeat).toBe(true);
  });

  it('covers one hour with fixed timestamps', () => {
    const timestamps = data.visits.map(({ visitedAt }) => visitedAt.getTime());

    expect(Math.max(...timestamps) - Math.min(...timestamps)).toBe(60 * 60_000);
    expect(createSeedData()).toEqual(data);
  });
});
