import { validateEnvironment } from './environment.js';

describe('environment validation', () => {
  it('provides typed local defaults', () => {
    expect(validateEnvironment({})).toMatchObject({
      PORT: 3001,
      MONGODB_URI: 'mongodb://localhost:27017/fictional_web',
      FRONTEND_ORIGIN: 'http://localhost:3000',
    });
  });

  it('normalizes configured values', () => {
    expect(
      validateEnvironment({
        PORT: '4100',
        MONGODB_URI: ' mongodb://localhost:27017/fictional_web_test ',
        FRONTEND_ORIGIN: 'https://example.test/',
      }),
    ).toMatchObject({
      PORT: 4100,
      MONGODB_URI: 'mongodb://localhost:27017/fictional_web_test',
      FRONTEND_ORIGIN: 'https://example.test',
    });
  });

  it.each(['', 'abc', '0', '65536', '1.5'])(
    'rejects invalid PORT %s',
    (port) => {
      expect(() => validateEnvironment({ PORT: port })).toThrow(
        'PORT must be an integer between 1 and 65535',
      );
    },
  );

  it.each([
    'not-a-uri',
    'http://localhost:27017/fictional_web',
    'mongodb://localhost:27017',
  ])('rejects invalid MONGODB_URI %s', (mongodbUri) => {
    expect(() => validateEnvironment({ MONGODB_URI: mongodbUri })).toThrow(
      /MONGODB_URI/,
    );
  });

  it.each([
    'not-an-origin',
    'ftp://example.test',
    'https://example.test/path',
    'https://user@example.test',
  ])('rejects invalid FRONTEND_ORIGIN %s', (frontendOrigin) => {
    expect(() =>
      validateEnvironment({ FRONTEND_ORIGIN: frontendOrigin }),
    ).toThrow('FRONTEND_ORIGIN must be a valid HTTP origin');
  });
});
