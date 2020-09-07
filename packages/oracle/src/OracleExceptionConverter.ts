import {
  Dictionary, DriverException, ExceptionConverter,
} from '@mikro-orm/core';

export class OracleExceptionConverter extends ExceptionConverter {

  convertException(exception: Error & Dictionary): DriverException {
    return super.convertException(exception);
  }

}
