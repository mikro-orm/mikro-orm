import type { Dictionary } from '../typings.js';
import { DriverException } from '../exceptions.js';

/** Converts native database errors into standardized DriverException instances. */
export class ExceptionConverter {
  /* v8 ignore next */
  convertException(exception: Error & Dictionary): DriverException {
    return new DriverException(exception);
  }
}
