export const FICTIONAL_ADDRESS_PATTERN =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.zz$/;

export function normalizeFictionalAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function isValidFictionalAddress(address: string): boolean {
  return FICTIONAL_ADDRESS_PATTERN.test(normalizeFictionalAddress(address));
}
