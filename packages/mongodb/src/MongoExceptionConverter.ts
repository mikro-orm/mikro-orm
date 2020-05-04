import { Dictionary, DriverException, UniqueConstraintViolationException, ExceptionConverter } from '@mikro-orm/core';

export class MongoExceptionConverter extends ExceptionConverter {

  /* istanbul ignore next */
  /**
   * @link http://www.postgresql.org/docs/9.4/static/errcodes-appendix.html
   */
  convertException(exception: Error & Dictionary): DriverException {
    switch (exception.code) {
      case 11000:
        return new UniqueConstraintViolationException(exception);
    }

    return super.convertException(exception);
  }

}
