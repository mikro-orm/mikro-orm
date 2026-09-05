import { defineEntity } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mssql';
import { vi } from 'vitest';

const Foo = defineEntity({
  name: 'Foo',
  properties: p => ({ id: p.integer().primary() }),
});

// `create database` clones the `model` database under an exclusive lock, so concurrent calls
// (e.g. parallel test workers) can fail with error 1807 and need to be retried.
describe('createDatabase retry on model database lock [mssql]', () => {
  let orm: MikroORM;

  // tedious reports the failure as an array of request errors
  const modelLockError = () => [
    Object.assign(new Error(`Could not obtain exclusive lock on database 'model'. Retry the operation later.`), {
      code: 'EREQUEST',
      number: 1807,
    }),
    Object.assign(
      new Error('CREATE DATABASE failed. Some file names listed could not be created. Check related errors.'),
      {
        code: 'EREQUEST',
        number: 1802,
      },
    ),
  ];

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: 'mikro_orm_test_create_db_retry',
      password: 'Root.Root',
      entities: [Foo],
    });
  });

  beforeEach(() => {
    vi.spyOn(orm.driver, 'reconnect').mockResolvedValue(orm.em.getConnection());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => orm.close(true));

  test('retries when the model database is locked', async () => {
    const execute = vi
      .spyOn(orm.em.getConnection(), 'execute')
      .mockRejectedValueOnce(modelLockError())
      .mockRejectedValueOnce(modelLockError())
      .mockResolvedValue([]);

    await orm.schema.createDatabase('mikro_orm_test_create_db_retry');
    // two failed attempts + successful attempt with two statements (`create database` + `use`)
    expect(execute).toHaveBeenCalledTimes(4);
  });

  test('rethrows when the model database lock persists', async () => {
    const execute = vi.spyOn(orm.em.getConnection(), 'execute').mockRejectedValue(modelLockError());

    await expect(orm.schema.createDatabase('mikro_orm_test_create_db_retry')).rejects.toThrow(
      `Could not obtain exclusive lock on database 'model'`,
    );
    expect(execute).toHaveBeenCalledTimes(5);
  });

  test('does not retry other errors', async () => {
    const execute = vi
      .spyOn(orm.em.getConnection(), 'execute')
      .mockRejectedValue(Object.assign(new Error('some other error'), { code: 'EREQUEST', number: 102 }));

    await expect(orm.schema.createDatabase('mikro_orm_test_create_db_retry')).rejects.toThrow('some other error');
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
