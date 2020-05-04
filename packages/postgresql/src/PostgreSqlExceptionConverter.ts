import {
  DeadlockException, Dictionary, DriverException, ExceptionConverter, ForeignKeyConstraintViolationException, InvalidFieldNameException,
  NonUniqueFieldNameException, NotNullConstraintViolationException, SyntaxErrorException, TableExistsException,
  TableNotFoundException, UniqueConstraintViolationException,
} from '@mikro-orm/core';

export class PostgreSqlExceptionConverter extends ExceptionConverter {

  /* istanbul ignore next */
  /**
   * @link http://www.postgresql.org/docs/9.4/static/errcodes-appendix.html
   * @link https://github.com/doctrine/dbal/blob/master/src/Driver/AbstractPostgreSQLDriver.php
   */
  convertException(exception: Error & Dictionary): DriverException {
    switch (exception.code) {
      case '40001':
      case '40P01':
        return new DeadlockException(exception);
      case '0A000':
        // Foreign key constraint violations during a TRUNCATE operation
        // are considered "feature not supported" in PostgreSQL.
        if (exception.message.includes('truncate')) {
          return new ForeignKeyConstraintViolationException(exception);
        }

        break;
      case '23502':
        return new NotNullConstraintViolationException(exception);
      case '23503':
        return new ForeignKeyConstraintViolationException(exception);
      case '23505':
        return new UniqueConstraintViolationException(exception);
      case '42601':
        return new SyntaxErrorException(exception);
      case '42702':
        return new NonUniqueFieldNameException(exception);
      case '42703':
        return new InvalidFieldNameException(exception);
      case '42P01':
        return new TableNotFoundException(exception);
      case '42P07':
        return new TableExistsException(exception);
    }

    return super.convertException(exception);
  }

}
