import { ForeignKeyConstraintViolationException } from '@mikro-orm/core';
import { PostgreSqlExceptionConverter } from '../../../packages/sql/src/dialects/postgresql/PostgreSqlExceptionConverter.js';

describe('PostgreSqlExceptionConverter', () => {
  test.each(['23001', '23503'])('maps SQLSTATE %s to a foreign key constraint violation', code => {
    const converter = new PostgreSqlExceptionConverter();
    const error = Object.assign(
      new Error('update or delete on table "x" violates RESTRICT setting of foreign key constraint "y" on table "z"'),
      { code },
    );

    expect(converter.convertException(error)).toBeInstanceOf(ForeignKeyConstraintViolationException);
  });
});
