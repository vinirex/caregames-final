/** Unwrap database/sql nullable values as well as plain JSON values. */
function unwrap(value: unknown, key: 'String' | 'Time' | 'Int64'): unknown {
  if (typeof value !== 'object' || value === null) return value;
  const nullable = value as Record<string, unknown>;
  return nullable.Valid === true ? nullable[key] : undefined;
}

export function readString(value: unknown): string {
  const key = typeof value === 'object' && value !== null && 'Time' in value ? 'Time' : 'String';
  const result = unwrap(value, key);
  return typeof result === 'string' ? result : '';
}

export function readNumber(value: unknown): number | undefined {
  const result = unwrap(value, 'Int64');
  return typeof result === 'number' && Number.isFinite(result) ? result : undefined;
}
