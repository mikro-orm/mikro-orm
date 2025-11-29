import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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
    metadataProvider: ReflectMetadataProvider,
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

test('cursor pagination when some properties are missing', async () => {
  await expect(orm.em.findByCursor(Book, {}, {
    first: 5,
    after: {
      id: 16,
    },
    orderBy: {
      metadata: {
        createdAt: 'desc',
      },
    },
    populate: [
      'metadata',
    ],
  })).rejects.toThrow(`Invalid cursor condition, value for 'Book.metadata' is missing.`);

  await expect(orm.em.findByCursor(Book, {}, {
    first: 5,
    after: {
      metadata: {
        id: 16,
      },
      id: 16,
    },
    orderBy: {
      metadata: {
        createdAt: 'desc',
      },
    },
    populate: [
      'metadata',
    ],
  })).rejects.toThrow(`Invalid cursor condition, value for 'Book.metadata.createdAt' is missing.`);
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
