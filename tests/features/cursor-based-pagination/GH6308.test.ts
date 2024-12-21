import { Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Metadata {

  @PrimaryKey()
  id!: number;

  @Property()
  createdAt!: Date;

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Metadata)
  metadata!: Metadata;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Metadata, Book],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();

  for (let i = 1; i <= 20; i++) {
    orm.em.create(Book, {
      id: i,
      metadata: {
        id: i,
        createdAt: new Date(`2024-01-${('' + i).padStart(2, '0')}T00:00:00Z`),
      },
    });
  }

  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('cursor pagination with relations', async () => {
  const cursor = await orm.em.findByCursor(Book, {}, {
    first: 5,
    after: {
      metadata: {
        createdAt: new Date('2024-01-16T00:00:00.000Z'),
      },
      id: 16,
    },
    orderBy: {
      metadata: {
        createdAt: 'desc',
      },
      id: 'desc',
    },
    populate: [
      'metadata',
    ],
  });
  expect(cursor).toHaveLength(5);
});
