import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class MyEntity {

  @PrimaryKey()
  id?: number;

  @Property({ type: 'json' })
  postIds!: number[];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [MyEntity],
    dbName: `:memory:`,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

test('insertMany array of numbers to JSON', async () => {
  await orm.em.insertMany(MyEntity, [
    {
      id: 1,
      postIds: [10, 11, 12],
    },
    {
      id: 2,
      postIds: [20, 21],
    },
  ]);
});

test('insertMany entities array of numbers to JSON', async () => {
  await orm.em.insertMany([
    orm.em.create(MyEntity, {
      id: 1,
      postIds: [10, 11, 12],
    }),
    orm.em.create(MyEntity, {
      id: 2,
      postIds: [20, 21],
    }),
  ]);
});

test('upsertMany array of numbers to JSON', async () => {
  await orm.em.upsertMany(MyEntity, [
    {
      id: 1,
      postIds: [10, 11, 12],
    },
    {
      id: 2,
      postIds: [20, 21],
    },
  ]);
});

test('upsert array of numbers to JSON', async () => {
  await orm.em.upsert(MyEntity, {
    id: 1,
    postIds: [10, 11, 12],
  });
});

test('insert array of numbers to JSON', async () => {
  await orm.em.insert(MyEntity, {
    id: 1,
    postIds: [10, 11, 12],
  });
});

test('flush one array of numbers to JSON', async () => {
  orm.em.create(MyEntity, {
    id: 1,
    postIds: [10, 11, 12],
  });
  await orm.em.flush();
});

test('flush many array of numbers to JSON', async () => {
  orm.em.create(MyEntity, {
    id: 1,
    postIds: [10, 11, 12],
  });
  orm.em.create(MyEntity, {
    id: 2,
    postIds: [20, 21],
  });
  await orm.em.flush();
});
