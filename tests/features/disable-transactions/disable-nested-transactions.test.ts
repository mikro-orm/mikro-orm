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
  });
  await orm.schema.refreshDatabase();
});

afterEach(async () => {
  await orm.close(true);
});

test('should only commit once', async () => {
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
  }, { ignoreNestedTransactions: true });

  const count = await orm.em.count(Example);

  expect(count).toBe(2);

  expect(mock.mock.calls).toHaveLength(7);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[2][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[3][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[4][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[5][0]).toMatch('commit');
  expect(mock.mock.calls[6][0]).toMatch('select count(*) as `count` from `example` as `e0`');
});

test('should handle rollback in real transaction', async () => {
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
  }, { ignoreNestedTransactions: true });

  await expect(transaction).rejects.toThrow('roll me back');

  const count = await orm.em.count(Example);

  expect(count).toBe(0);

  expect(mock.mock.calls).toHaveLength(7);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[2][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[3][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[4][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[5][0]).toMatch('rollback');
  expect(mock.mock.calls[6][0]).toMatch('select count(*) as `count` from `example` as `e0`');
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
  }, { ignoreNestedTransactions: true });

  await expect(transaction).rejects.toThrow('roll me back');

  const count = await orm.em.count(Example);

  expect(count).toBe(0);

  expect(mock.mock.calls).toHaveLength(5);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('insert into `example` (`name`) values (?) returning `id`');
  expect(mock.mock.calls[2][0]).toMatch('select count(*) as `count` from `example` as `e0`');
  expect(mock.mock.calls[3][0]).toMatch('rollback');
  expect(mock.mock.calls[4][0]).toMatch('select count(*) as `count` from `example` as `e0`');
});
