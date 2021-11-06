import type { Dictionary, DriverException } from '@mikro-orm/core';
import {
  ConnectionException, ExceptionConverter, InvalidFieldNameException, LockWaitTimeoutException, NonUniqueFieldNameException,
  NotNullConstraintViolationException, ReadOnlyException, SyntaxErrorException, TableExistsException, TableNotFoundException, UniqueConstraintViolationException,
} from '@mikro-orm/core';

export class SqliteExceptionConverter extends ExceptionConverter {

  /* istanbul ignore next */
  /**
   * @inheritDoc
   * @link http://www.sqlite.org/c3ref/c_abort.html
   * @link https://github.com/doctrine/dbal/blob/master/src/Driver/AbstractSQLiteDriver.php
   */
  convertException(exception: Error & Dictionary): DriverException {
    if (exception.message.includes('database is locked')) {
      return new LockWaitTimeoutException(exception);
    }

    if (
      exception.message.includes('must be unique') ||
      exception.message.includes('is not unique') ||
      exception.message.includes('are not unique') ||
      exception.message.includes('UNIQUE constraint failed')
    ) {
      return new UniqueConstraintViolationException(exception);
    }

    if (exception.message.includes('may not be NULL') || exception.message.includes('NOT NULL constraint failed')) {
      return new NotNullConstraintViolationException(exception);
    }

    if (exception.message.includes('no such table:')) {
      return new TableNotFoundException(exception);
    }

    if (exception.message.includes('already exists')) {
      return new TableExistsException(exception);
    }

    if (exception.message.includes('no such column:')) {
      return new InvalidFieldNameException(exception);
    }

    if (exception.message.includes('ambiguous column name')) {
      return new NonUniqueFieldNameException(exception);
    }

    if (exception.message.includes('syntax error')) {
      return new SyntaxErrorException(exception);
    }

    if (exception.message.includes('attempt to write a readonly database')) {
      return new ReadOnlyException(exception);
    }

    if (exception.message.includes('unable to open database file')) {
      return new ConnectionException(exception);
    }

    return super.convertException(exception);
  }

}
