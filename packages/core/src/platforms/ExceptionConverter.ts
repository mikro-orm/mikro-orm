import type { Dictionary } from '../typings.js';
import { DriverException } from '../exceptions.js';

export class ExceptionConverter {

  /* v8 ignore next 3 */
  convertException(exception: Error & Dictionary): DriverException {
    return new DriverException(exception);
  }

}
