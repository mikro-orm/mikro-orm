import { getEnv } from '../utils/env-vars.js';

const bool = (k: string): boolean => ['true', 't', '1'].includes(getEnv(k)?.toLowerCase() ?? '');
const boolIfDefined = (k: string): boolean => (getEnv(k) != null ? bool(k) : true);
const enabled = (): boolean =>
  !bool('NO_COLOR') && !bool('MIKRO_ORM_NO_COLOR') && boolIfDefined('FORCE_COLOR') && boolIfDefined('MIKRO_ORM_COLORS');
const wrap =
  (fn: (text: string) => string): ((text: string) => string) =>
  (text: string) =>
    enabled() ? fn(text) : text;

/** @internal */
export const colors: {
  red: (text: string) => string;
  green: (text: string) => string;
  yellow: (text: string) => string;
  grey: (text: string) => string;
  cyan: (text: string) => string;
  enabled: () => boolean;
} = {
  red: wrap((text: string) => `\x1B[31m${text}\x1B[39m`),
  green: wrap((text: string) => `\x1B[32m${text}\x1B[39m`),
  yellow: wrap((text: string) => `\x1B[33m${text}\x1B[39m`),
  grey: wrap((text: string) => `\x1B[90m${text}\x1B[39m`),
  cyan: wrap((text: string) => `\x1B[36m${text}\x1B[39m`),
  enabled,
};
