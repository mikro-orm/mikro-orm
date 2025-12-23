import { ExceptionConverter, type DriverException, UniqueConstraintViolationException, type Dictionary } from '@mikro-orm/core';

// Neo4j error codes documented at https://neo4j.com/docs/status-codes/current/
export class Neo4jExceptionConverter extends ExceptionConverter {

  override convertException(exception: Error & Dictionary): DriverException {
    const code = exception.code as string | undefined;

    if (code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
      return new UniqueConstraintViolationException(exception);
    }

    return super.convertException(exception);
  }

}
