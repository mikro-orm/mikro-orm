import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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

// Entities for 3-level nesting test
@Entity()
class Profile {

  @PrimaryKey()
  id!: number;

  @Property()
  rating!: number;

}

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Profile)
  profile!: Profile;

}

@Entity()
class Article {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Metadata, Book, Profile, Author, Article],
    dbName: ':memory:',
  });
  await orm.schema.refresh();

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
  await expect(orm.em.findByCursor(Book, {
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

  await expect(orm.em.findByCursor(Book, {
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
  const cursor = await orm.em.findByCursor(Book, {
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

test('cursor pagination with deeply nested missing property (3 levels)', async () => {
  // The cursor has 'author' but author.profile is missing
  await expect(orm.em.findByCursor(Article, {
    first: 5,
    after: {
      author: {
        name: 'John', // profile is missing
      },
      id: 1,
    },
    orderBy: {
      author: {
        profile: {
          rating: 'desc',
        },
      },
      id: 'asc',
    },
    populate: ['author.profile'],
  })).rejects.toThrow(`Invalid cursor condition, value for 'Article.author.profile' is missing.`);
});
