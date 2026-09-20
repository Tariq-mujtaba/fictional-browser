import {
  ALLOWED_SEED_DATABASES,
  assertSeedDatabaseAllowed,
} from './seed.guard.js';

describe('seed database guard', () => {
  it.each(ALLOWED_SEED_DATABASES)('allows %s', (databaseName) => {
    expect(() => assertSeedDatabaseAllowed(databaseName)).not.toThrow();
  });

  it('rejects every other database', () => {
    expect(() => assertSeedDatabaseAllowed('production')).toThrow(
      'Refusing to seed database "production"',
    );
  });
});
