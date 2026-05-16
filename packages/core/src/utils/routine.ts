import { ScalarReference } from '../entity/Reference.js';
import type { Platform } from '../platforms/Platform.js';
import type { Type } from '../types/Type.js';
import type { RoutineProperty } from '../typings.js';

/**
 * Unwraps a routine argument (resolving any `ScalarReference` wrapper) and, when the parameter
 * declares a `customType`, marshals the value through `convertToDatabaseValue` so callers can
 * pass JS-native values without per-call boilerplate. `undefined` is normalised to `null` so all
 * drivers see the same shape regardless of how the caller declared optional params.
 */
export function convertRoutineInbound(value: unknown, param: RoutineProperty | undefined, platform: Platform): unknown {
  const resolved = value instanceof ScalarReference ? value.unwrap() : value;
  const coerced = resolved === undefined ? null : resolved;

  if (coerced === null || !param?.customType) {
    return coerced;
  }

  return param.customType.convertToDatabaseValue(coerced, platform);
}

/**
 * Converts a raw database value to its JS representation via the supplied `customType`, when one
 * is declared. Used by drivers to marshal scalar function returns and OUT/INOUT parameter values
 * back to the caller before they hit a `ScalarReference` or the return value of `em.callRoutine`.
 */
export function convertRoutineOutbound<T>(
  value: unknown,
  customType: Type<unknown> | undefined,
  platform: Platform,
): T {
  if (value === null || value === undefined || !customType) {
    return value as T;
  }

  return customType.convertToJSValue(value, platform) as T;
}
