import { Entity, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class MyEntity1 {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'json' })
  field!: object;

}

@Entity()
class MyEntity2 {

  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'json', columnType: 'json' })
  field!: object;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    loggerFactory: SimpleLogger.create,
    entities: [MyEntity1, MyEntity2],
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));
beforeEach(() => orm.schema.clearDatabase());

test('JSON serialization with upsert', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);
  const entity1 = orm.em.create(MyEntity1, {
    id: 1,
    field: {
      firstName: 'John',
      lastName: 'Doe',
    },
  });
  await orm.em.upsert(entity1);
  const entity2 = orm.em.create(MyEntity2, {
    id: 1,
    field: {
      firstName: 'Albert',
      lastName: 'Doe',
    },
  });
  await orm.em.upsert(entity2);
  expect(mock.mock.calls).toEqual([
    ['[query] insert into `my_entity1` (`id`, `field`) values (1, \'{"firstName":"John","lastName":"Doe"}\') on conflict (`id`) do update set `field` = excluded.`field` returning `id`'],
    ['[query] insert into `my_entity2` (`id`, `field`) values (1, \'{"firstName":"Albert","lastName":"Doe"}\') on conflict (`id`) do update set `field` = excluded.`field` returning `id`'],
  ]);
});

test('JSON serialization with upsertMany', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);
  const entity1 = orm.em.create(MyEntity1, {
    id: 1,
    field: {
      firstName: 'John',
      lastName: 'Doe',
    },
  });
  await orm.em.upsertMany([entity1]);
  const entity2 = orm.em.create(MyEntity2, {
    id: 1,
    field: {
      firstName: 'Albert',
      lastName: 'Doe',
    },
  });
  await orm.em.upsertMany([entity2]);
  expect(mock.mock.calls).toEqual([
    ['[query] insert into `my_entity1` (`id`, `field`) values (1, \'{"firstName":"John","lastName":"Doe"}\') on conflict (`id`) do update set `field` = excluded.`field` returning `id`'],
    ['[query] insert into `my_entity2` (`id`, `field`) values (1, \'{"firstName":"Albert","lastName":"Doe"}\') on conflict (`id`) do update set `field` = excluded.`field` returning `id`'],
  ]);
});

test('upsertMany with managed entity calls assign', async () => {
  const mock = mockLogger(orm, ['query', 'query-params']);
  const entity1 = orm.em.create(MyEntity1, {
    id: 1,
    field: {
      firstName: 'John',
      lastName: 'Doe',
    },
  });
  await orm.em.flush();
  (entity1.field as any).firstName = '123';
  await orm.em.upsertMany([entity1]);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    [`[query] insert into \`my_entity1\` (\`id\`, \`field\`) values (1, '{"firstName":"John","lastName":"Doe"}')`],
    ['[query] commit'],
    ['[query] insert into `my_entity1` (`id`, `field`) values (1, \'{"firstName":"123","lastName":"Doe"}\') on conflict (`id`) do update set `field` = excluded.`field` returning `id`'],
  ]);
});
