import { Entity, IDatabaseDriver, MikroORM, PrimaryKey, Property, SimpleLogger, Utils } from '@mikro-orm/core';
import { MongoDriver, ObjectId } from '@mikro-orm/mongodb';
import { mockLogger, PLATFORMS } from '../../bootstrap';

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

}

@Entity()
class MongoBook {

  @PrimaryKey({ name: '_id' })
  id!: ObjectId;

  @Property()
  title!: string;

}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_upsert2', port: 3308 },
  mariadb: { dbName: 'mikro_orm_upsert2', port: 3309 },
  postgresql: { dbName: 'mikro_orm_upsert2' },
};

describe.each(Utils.keys(options))('em.upsert without unique values [%s]',  type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      driver: PLATFORMS[type],
      entities: [Book],
      loggerFactory: SimpleLogger.create,
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('em.upsert() without unique values', async () => {
    const mock = mockLogger(orm);

    const b1 = await orm.em.upsert(Book, {
      title: 'foo 1',
    });
    expect(b1.id).toBe(1);
    orm.em.clear();

    const books = await orm.em.upsertMany(Book, [
      { id: b1.id, title: 'foo 12' },
      { title: 'foo 2' },
      { title: 'foo 3' },
    ]);

    expect(books).toHaveLength(3);
    expect(books[0].id).toBe(1);
    expect(books[0].title).toBe('foo 12');
    expect(books[1].title).toBe('foo 2');
    expect(books[1].id).toBe(2);
    expect(books[2].title).toBe('foo 3');
    expect(books[2].id).toBe(3);

    expect(mock.mock.calls).toMatchSnapshot(type);
  });
});

describe('em.upsert without unique values [mongo]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      driver: MongoDriver,
      entities: [MongoBook],
      dbName: 'mikro_orm_upsert2',
      loggerFactory: SimpleLogger.create,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('em.upsert() without unique values', async () => {
    const mock = mockLogger(orm);

    const b1 = await orm.em.upsert(MongoBook, {
      title: 'foo 1',
    });
    expect(b1.id).toBeInstanceOf(ObjectId);
    orm.em.clear();

    const books = await orm.em.upsertMany(MongoBook, [
      { id: b1.id, title: 'foo 12' },
      { title: 'foo 2' },
      { title: 'foo 3' },
    ]);

    expect(books).toHaveLength(3);
    expect(books[0].id).toBeInstanceOf(ObjectId);
    expect(books[0].title).toBe('foo 12');
    expect(books[1].id).toBeInstanceOf(ObjectId);
    expect(books[1].title).toBe('foo 2');
    expect(books[2].id).toBeInstanceOf(ObjectId);
    expect(books[2].title).toBe('foo 3');

    mock.mock.calls[2][0] = mock.mock.calls[2][0].replaceAll(b1.id, '[generated-object-id]');
    expect(mock.mock.calls).toMatchSnapshot('mongo');
  });
});
