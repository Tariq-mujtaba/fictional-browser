export const ALLOWED_SEED_DATABASES = [
  'fictional_web',
  'fictional_web_test',
] as const;

export function assertSeedDatabaseAllowed(databaseName: string): void {
  if (!(ALLOWED_SEED_DATABASES as readonly string[]).includes(databaseName)) {
    throw new Error(
      `Refusing to seed database "${databaseName}". Allowed databases: ${ALLOWED_SEED_DATABASES.join(', ')}`,
    );
  }
}
