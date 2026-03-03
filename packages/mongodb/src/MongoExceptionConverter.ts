import {
  UniqueConstraintViolationException,
  ExceptionConverter,
  TableExistsException,
  type Dictionary,
  type DriverException,
} from '@mikro-orm/core';

export class MongoExceptionConverter extends ExceptionConverter {
  /**
   * @see https://gist.github.com/rluvaton/a97a8da46ab6541a3e5702e83b9d357b
   */
  /* v8 ignore next */
  override convertException(exception: Error & Dictionary): DriverException {
    switch (exception.code) {
      case 48:
        return new TableExistsException(exception);
      case 11000:
        return new UniqueConstraintViolationException(exception);
    }

    return super.convertException(exception);
  }
}
