import { TYPES } from 'tedious';

export function isTVP(value: any): boolean {
  return value != null && typeof value === 'object' && value.type === TYPES.TVP;
}
