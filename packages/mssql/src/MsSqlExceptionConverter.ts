import {
  CheckConstraintViolationException,
  DeadlockException,
  ExceptionConverter,
  ForeignKeyConstraintViolationException,
  InvalidFieldNameException,
  LockWaitTimeoutException,
  NonUniqueFieldNameException,
  NotNullConstraintViolationException,
  SyntaxErrorException,
  TableExistsException,
  TableNotFoundException,
  UniqueConstraintViolationException,
  type Dictionary,
  type DriverException,
} from '@mikro-orm/core';

/** Converts MSSQL native errors into typed MikroORM driver exceptions. */
export class MsSqlExceptionConverter extends ExceptionConverter {
  /**
   * @see https://learn.microsoft.com/en-us/sql/relational-databases/errors-events/database-engine-events-and-errors
   * @see https://github.com/doctrine/dbal/blob/4.4.x/src/Driver/API/SQLSrv/ExceptionConverter.php
   */
  override convertException(exception: Error & Dictionary): DriverException {
    // the kysely mssql driver rejects with a plain array when a request produces multiple errors
    if (Array.isArray(exception) && exception.length > 0) {
      const [first, ...rest] = exception;
      first.message += rest.map(e => '\n' + e.message).join('');
      exception = first;
    }

    let errno = exception.number;

    /* v8 ignore next */
    if (
      'errors' in exception &&
      Array.isArray(exception.errors) &&
      typeof exception.errors[0] === 'object' &&
      'message' in exception.errors[0]
    ) {
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
      case 547:
        // 547 covers both referential (FOREIGN KEY/REFERENCE) and CHECK constraint
        // violations; only the message distinguishes them. The surrounding text is
        // localized (e.g. "CHECK-Einschränkung" on a German server), but the
        // constraint-type keyword itself is an untranslated SQL keyword, so match on
        // the bare `CHECK` token.
        if (exception.message.includes('CHECK')) {
          return new CheckConstraintViolationException(exception);
        }

        return new ForeignKeyConstraintViolationException(exception);
      case 4712:
        // TRUNCATE blocked because the table is referenced by a FOREIGN KEY.
        return new ForeignKeyConstraintViolationException(exception);
      case 1205:
        return new DeadlockException(exception);
      case 1222:
        return new LockWaitTimeoutException(exception);
      case 2601:
      case 2627:
        return new UniqueConstraintViolationException(exception);
      case 2714:
        return new TableExistsException(exception);
    }

    return super.convertException(exception);
  }
}
