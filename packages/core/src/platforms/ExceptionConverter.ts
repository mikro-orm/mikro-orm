import { Dictionary } from '../typings';
import { DriverException } from '../exceptions';

export class ExceptionConverter {

  /* istanbul ignore next */
  convertException(exception: Error & Dictionary): DriverException {
    return new DriverException(exception);
  }

}
