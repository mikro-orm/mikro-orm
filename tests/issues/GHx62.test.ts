import { MikroORM, wrap } from '@mikro-orm/sqlite';
import {
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Embeddable()
class Profile {
  @Property()
  a!: string;

  @Property()
  b!: string;
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  label!: string;

  @Property({ nullable: true })
  note?: string | null;

  @ManyToOne(() => Author)
  author!: Author;

  @Embedded(() => Profile, { object: false })
  profile!: Profile;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Author, Book, Profile],
  });
  await orm.schema.create();

  const em = orm.em.fork();
  const author = em.create(Author, { id: 1, name: 'Lu' });

  for (const id of [1, 2, 3, 4, 5]) {
    em.create(Book, { id, label: 'foo', note: 'bar', author, profile: { a: 'A', b: 'B' } });
  }

  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('partially loaded entity from a transactional fork does not clobber the parent context', async () => {
  const em = orm.em.fork();
  const loaded = await em.findOneOrFail(Book, 1, { populate: ['author'] });

  await em.transactional(
    async fork => {
      const partial = await fork.findOneOrFail(Book, 1, { fields: ['id'] });
      expect(wrap(partial).isInitialized()).toBe(true);
    },
    // `em.transactional()` reuses the parent instances unless we clear the fork
    { clear: true },
  );

  const again = await em.findOneOrFail(Book, 1);
  expect(again).toBe(loaded);
  expect(again.label).toBe('foo');
  expect(again.note).toBe('bar');
  expect(again.profile).toEqual({ a: 'A', b: 'B' });
  expect(wrap(again.author).isInitialized()).toBe(true);
  expect(again.author.name).toBe('Lu');

  // the partial snapshot must not leak into change detection
  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('partially selected inline embeddable is not propagated to the parent context', async () => {
  const em = orm.em.fork();
  const loaded = await em.findOneOrFail(Book, 2);

  await em.transactional(
    async fork => {
      await fork.findOneOrFail(Book, 2, { fields: ['id', 'profile.a'] });
    },
    { clear: true },
  );

  expect(loaded.profile).toEqual({ a: 'A', b: 'B' });

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('values known to the fork win over the parent state', async () => {
  const em = orm.em.fork();
  const loaded = await em.findOneOrFail(Book, 3);

  await em.transactional(
    async fork => {
      const book: Book = await fork.findOneOrFail(Book, 3, { fields: ['id', 'label', 'author', 'profile'] });
      book.label = 'baz';
      // `note` was not selected, but the assigned value is still propagated
      book.note = null;
    },
    { clear: true },
  );

  expect(loaded.label).toBe('baz');
  expect(loaded.note).toBeNull();
});

test('embeddable assigned in a partially loaded fork is propagated to the parent context', async () => {
  const em = orm.em.fork();
  const loaded = await em.findOneOrFail(Book, 4);

  await em.transactional(
    async fork => {
      const book = await fork.findOneOrFail(Book, 4, { fields: ['id', 'label', 'author'] });
      wrap(book).assign({ profile: { a: 'C', b: 'D' } });
    },
    { clear: true },
  );

  expect(loaded.profile).toEqual({ a: 'C', b: 'D' });

  const mock = mockLogger(orm);
  await em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('nested transactional fork does not clobber the parent context', async () => {
  const em = orm.em.fork();
  const loaded = await em.findOneOrFail(Book, 5, { populate: ['author'] });

  await em.transactional(
    async fork => {
      await fork.findOneOrFail(Book, 5, { fields: ['id', 'label'] });
      await fork.transactional(
        async nested => {
          await nested.findOneOrFail(Book, 5, { fields: ['id'] });
        },
        { clear: true },
      );
    },
    { clear: true },
  );

  expect(loaded.label).toBe('foo');
  expect(loaded.note).toBe('bar');
  expect(loaded.profile).toEqual({ a: 'A', b: 'B' });
  expect(wrap(loaded.author).isInitialized()).toBe(true);
});
