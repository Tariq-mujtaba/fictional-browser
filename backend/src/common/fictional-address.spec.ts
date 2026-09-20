import {
  isValidFictionalAddress,
  normalizeFictionalAddress,
} from './fictional-address.js';

describe('fictional addresses', () => {
  it('normalizes whitespace and letter case', () => {
    expect(normalizeFictionalAddress('  Atlas-Archive.ZZ  ')).toBe(
      'atlas-archive.zz',
    );
  });

  it.each([
    'a.zz',
    'atlas.zz',
    'atlas-archive.zz',
    `${'a'.repeat(63)}.zz`,
    '  Atlas.ZZ  ',
  ])('accepts %s', (address) => {
    expect(isValidFictionalAddress(address)).toBe(true);
  });

  it.each([
    '',
    'atlas.com',
    'https://atlas.zz',
    'www.atlas.zz',
    '-atlas.zz',
    'atlas-.zz',
    'atlas_archive.zz',
    `${'a'.repeat(64)}.zz`,
  ])('rejects %s', (address) => {
    expect(isValidFictionalAddress(address)).toBe(false);
  });
});
