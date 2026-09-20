const DEFAULT_PORT = 3001;
const DEFAULT_MONGODB_URI = 'mongodb://localhost:27017/fictional_web';
const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:3000';

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
  const port = parsePort(environment.PORT ?? DEFAULT_PORT);
  const mongodbUri = parseMongoUri(
    environment.MONGODB_URI ?? DEFAULT_MONGODB_URI,
  );
  const frontendOrigin = parseFrontendOrigin(
    environment.FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN,
  );

  return {
    ...environment,
    PORT: port,
    MONGODB_URI: mongodbUri,
    FRONTEND_ORIGIN: frontendOrigin,
  };
}

function parsePort(value: unknown): number {
  const port =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN;

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}

function parseMongoUri(value: unknown): string {
  const uri = requireNonEmptyString('MONGODB_URI', value);
  let parsed: URL;

  try {
    parsed = new URL(uri);
  } catch {
    throw new Error('MONGODB_URI must be a valid MongoDB URI');
  }

  if (
    !['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) ||
    parsed.pathname === '' ||
    parsed.pathname === '/'
  ) {
    throw new Error(
      'MONGODB_URI must use mongodb:// or mongodb+srv:// and include a database name',
    );
  }

  return uri;
}

function parseFrontendOrigin(value: unknown): string {
  const origin = requireNonEmptyString('FRONTEND_ORIGIN', value);
  let parsed: URL;

  try {
    parsed = new URL(origin);
  } catch {
    throw new Error('FRONTEND_ORIGIN must be a valid HTTP origin');
  }

  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    (parsed.pathname !== '' && parsed.pathname !== '/') ||
    parsed.search !== '' ||
    parsed.hash !== ''
  ) {
    throw new Error('FRONTEND_ORIGIN must be a valid HTTP origin');
  }

  return parsed.origin;
}

function requireNonEmptyString(name: string, value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string`);
  }

  return value.trim();
}
