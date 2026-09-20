const FICTIONAL_ADDRESS_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.zz$/;

export function parseFictionalAddress(value: string): string | null {
  const address = value.trim().toLowerCase();
  return FICTIONAL_ADDRESS_PATTERN.test(address) ? address : null;
}
