import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { mockLogger } from '../../helpers.js';

@Entity()
export class Example {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeEach(async () => {
  orm = await MikroORM.init({
    entities: [Example],
    dbName: ':memory:',
    disableTransactions: true,
  });
  await orm.schema.refreshDatabase();
});

afterEach(async () => {
  await orm.close(true);
});

test('should skip transactions completely', async () => {
  const mock = mockLogger(orm, ['query']);

  await orm.em.transactional(async em => {
    await em.transactional(async () => {
      em.create(Example, { name: 'foo' });

      await em.flush();

      const count = await em.count(Example);

      expect(count).toBe(1);
    });

    em.create(Example, { name: 'bar' });

    await em.flush();

    const count = await em.count(Example);

    expect(count).toBe(2);
  });

  const count = await orm.em.count(Example);

  expect(count).toBe(2);

  expect(mock.mock.calls).toHaveLength(5);
  expect(mock.mock.calls[0][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[1][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[2][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[3][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[4][0]).toMatch('select count(*) as `count` from `example` as `e0`');
});

test('should skip transactions completely (begin/commit/rollback', async () => {
  const mock = mockLogger(orm, ['query']);

  await orm.em.begin();

  await orm.em.transactional(async em => {
    em.create(Example, { name: 'foo' });

    await em.flush();

    const count = await em.count(Example);

    expect(count).toBe(1);
    await orm.em.rollback();
  });

  orm.em.create(Example, { name: 'bar' });

  await orm.em.commit();

  const count = await orm.em.count(Example);

  expect(count).toBe(2);

  const count2 = await orm.em.count(Example);

  expect(count2).toBe(2);

  expect(mock.mock.calls).toHaveLength(5);
  expect(mock.mock.calls[0][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[1][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[2][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[3][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[4][0]).toMatch('select count(*) as `count` from `example` as `e0`');
});

test('no rollback as transactions are disabled', async () => {
  const mock = mockLogger(orm, ['query']);

  const transaction = orm.em.transactional(async em => {
    await em.transactional(async () => {
      em.create(Example, { name: 'foo' });

      await em.flush();

      const count = await em.count(Example);

      expect(count).toBe(1);
    });

    em.create(Example, { name: 'bar' });

    await em.flush();

    const count = await em.count(Example);

    expect(count).toBe(2);

    throw new Error('roll me back');
  });

  await expect(transaction).rejects.toThrow('roll me back');

  const count = await orm.em.count(Example);
  expect(count).toBe(2); // rollback didn't happen

  expect(mock.mock.calls).toHaveLength(5);
  expect(mock.mock.calls[0][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[1][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[2][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[3][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[4][0]).toMatch('select count(*) as `count` from `example` as `e0`');
});

test('should handle rollback in no-op transaction', async () => {
  const mock = mockLogger(orm, ['query']);

  const transaction = orm.em.transactional(async em => {
    await em.transactional(async () => {
      em.create(Example, { name: 'foo' });

      await em.flush();

      const count = await em.count(Example);

      expect(count).toBe(1);

      throw new Error('roll me back');
    });

    throw new Error('should not get here');
  });

  await expect(transaction).rejects.toThrow('roll me back');

  const count = await orm.em.count(Example);
  expect(count).toBe(1); // rollback didn't happen

  expect(mock.mock.calls).toHaveLength(3);
  expect(mock.mock.calls[0][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[1][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[2][0]).toMatch('select count(*) as `count` from `example` as `e0`');
});
