export function isTVP(value: any): boolean {
  return (
    value != null &&
    typeof value === 'object' &&
    Array.isArray(value.columns) &&
    Array.isArray(value.rows)
  );
}
