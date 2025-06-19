import { raw } from './RawQueryFragment';

export function quote(expParts: readonly string[], ...values: unknown[]) {
  return raw(expParts.join('??'), values);
}
