const bool = (v?: string) => v && ['true', 't', '1'].includes(v.toLowerCase());
const enabled = () => {
  if (process.env.FORCE_COLOR != null) {
    return bool(process.env.FORCE_COLOR);
  }

  if (process.env.MIKRO_ORM_NO_COLOR != null) {
    return !bool(process.env.MIKRO_ORM_NO_COLOR);
  }

  if (process.env.NO_COLOR != null) {
    return !bool(process.env.NO_COLOR);
  }

  if (process.env.MIKRO_ORM_COLORS != null) {
    return bool(process.env.MIKRO_ORM_COLORS);
  }

  return false;
};
const wrap = (fn: (text: string) => string) => (text: string) => enabled() ? fn(text) : text;

/** @internal */
export const colors = {
  red: wrap((text: string) => `\x1B[31m${text}\x1B[39m`),
  green: wrap((text: string) => `\x1B[32m${text}\x1B[39m`),
  yellow: wrap((text: string) => `\x1B[33m${text}\x1B[39m`),
  grey: wrap((text: string) => `\x1B[90m${text}\x1B[39m`),
  cyan: wrap((text: string) => `\x1B[36m${text}\x1B[39m`),
  enabled,
};
