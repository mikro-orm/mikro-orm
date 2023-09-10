import { DriverException } from '../exceptions';
import type { Dictionary } from '../typings';

export class ExceptionConverter {
  /* istanbul ignore next */
  convertException(exception: Error & Dictionary): DriverException {
    return new DriverException(exception);
  }
}
