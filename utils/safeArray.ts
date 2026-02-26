export const safeArray = <T>(val: unknown): T[] =>
  Array.isArray(val) ? (val as T[]) : [];