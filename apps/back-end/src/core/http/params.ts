export interface Params {
  [key: string]: string | number | boolean | undefined;
}

export function requireParam<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === null) {
    throw new Error(`Missing required param: ${name}`);
  }
  return value;
}

export function optionalParam<T>(value: T | undefined): T | undefined {
  return value;
}
