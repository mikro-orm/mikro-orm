import {
  ExceptionConverter,
  InvalidFieldNameException,
  NonUniqueFieldNameException,
  NotNullConstraintViolationException,
  SyntaxErrorException,
  TableExistsException,
  TableNotFoundException,
  UniqueConstraintViolationException,
  type Dictionary,
  type DriverException,
} from '@mikro-orm/core';

export class MsSqlExceptionConverter extends ExceptionConverter {

  /**
   * @link https://docs.microsoft.com/en-us/sql/relational-databases/errors-events/mssqlserver-511-database-engine-error?view=sql-server-ver15
   * @link https://github.com/doctrine/dbal/blob/master/src/Driver/AbstractPostgreSQLDriver.php
   */
  override convertException(exception: Error & Dictionary): DriverException {
    let errno = exception.number;

    /* v8 ignore next 5 */
    if ('errors' in exception && Array.isArray(exception.errors) && typeof exception.errors[0] === 'object' && 'message' in exception.errors[0]) {
      exception.message += '\n' + exception.errors.map(e => e.message).join('\n');
      errno ??= exception.errors[0].number;
      exception.lineNumber ??= exception.errors[0].lineNumber;
    }

    switch (errno) {
      case 515:
        return new NotNullConstraintViolationException(exception);
      case 102:
        return new SyntaxErrorException(exception);
      case 207:
        return new InvalidFieldNameException(exception);
      case 208:
        return new TableNotFoundException(exception);
      case 209:
        return new NonUniqueFieldNameException(exception);
      case 2601:
        return new UniqueConstraintViolationException(exception);
      case 2714:
        return new TableExistsException(exception);
    }

    return super.convertException(exception);
  }

}
