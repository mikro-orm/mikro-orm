import { Collection, MikroORM } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  name: string;

  @Property({ version: true })
  version!: number;

  @OneToMany(() => Book, book => book.author, { orphanRemoval: true })
  books = new Collection<Book>(this);

  constructor(name: string) {
    this.name = name;
  }
}

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToOne(() => Author, { nullable: true })
  author?: Author;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

  constructor(title: string) {
    this.title = title;
  }
}

describe('GH issue 8721', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Book, Tag],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  beforeEach(() => orm.schema.clear());

  const failAfterFlush = async (em: MikroORM['em']) => {
    await expect(
      em.transactional(async inner => {
        await inner.flush();
        throw new Error('Nested transaction failed');
      }),
    ).rejects.toThrow('Nested transaction failed');
  };

  test('pending insert survives a failed nested transaction that flushed', async () => {
    await orm.em.fork().transactional(async em => {
      const book = em.create(Book, { title: 'b1', author: new Author('a1') });
      await failAfterFlush(em);
      expect(book.id).toBeUndefined();
      expect(book.author!.id).toBeUndefined();
    });

    const books = await orm.em.fork().findAll(Book, { populate: ['author'] });
    expect(books).toMatchObject([{ title: 'b1', author: { name: 'a1' } }]);
  });

  test('pending insert survives a failed nested transaction that auto-flushed', async () => {
    await orm.em.fork().transactional(async em => {
      em.create(Book, { title: 'b1' });

      await expect(
        em.transactional(async inner => {
          await inner.count(Book);
          throw new Error('Nested transaction failed');
        }),
      ).rejects.toThrow('Nested transaction failed');
    });

    expect(await orm.em.fork().findAll(Book)).toMatchObject([{ title: 'b1' }]);
  });

  test('pending insert survives a nested transaction that failed while flushing', async () => {
    await orm.em.fork().insert(Author, { name: 'taken', version: 1 });

    await orm.em.fork().transactional(async em => {
      em.create(Book, { title: 'b1' });

      await expect(
        em.transactional(async inner => {
          inner.persist(new Author('taken'));
        }),
      ).rejects.toThrow(/unique/i);
    });

    expect(await orm.em.fork().findAll(Book)).toMatchObject([{ title: 'b1' }]);
    expect(await orm.em.fork().count(Author)).toBe(1);
  });

  test('pending update survives a failed nested transaction that flushed', async () => {
    await orm.em.fork().insert(Book, { id: 1, title: 'old' });

    await orm.em.fork().transactional(async em => {
      const book = await em.findOneOrFail(Book, 1);
      book.title = 'new';
      await failAfterFlush(em);
    });

    expect(await orm.em.fork().findAll(Book)).toMatchObject([{ title: 'new' }]);
  });

  test('pending update of a versioned entity survives a failed nested transaction that flushed', async () => {
    await orm.em.fork().insert(Author, { id: 1, name: 'old', version: 1 });

    await orm.em.fork().transactional(async em => {
      const author = await em.findOneOrFail(Author, 1);
      author.name = 'new';
      await failAfterFlush(em);
      expect(author.version).toBe(1);
    });

    expect(await orm.em.fork().findAll(Author)).toMatchObject([{ name: 'new', version: 2 }]);
  });

  test('pending collection update survives a failed nested transaction that flushed', async () => {
    await orm.em.fork().insert(Book, { id: 1, title: 'b1' });
    await orm.em.fork().insertMany(Tag, [
      { id: 1, name: 't1' },
      { id: 2, name: 't2' },
    ]);
    await orm.em.fork().transactional(async em => {
      const book = await em.findOneOrFail(Book, 1, { populate: ['tags'] });
      book.tags.add(em.getReference(Tag, 1));
    });

    await orm.em.fork().transactional(async em => {
      const book = await em.findOneOrFail(Book, 1, { populate: ['tags'] });
      book.tags.set([em.getReference(Tag, 2)]);
      await failAfterFlush(em);
    });

    const book = await orm.em.fork().findOneOrFail(Book, 1, { populate: ['tags'] });
    expect(book.tags.getItems()).toMatchObject([{ name: 't2' }]);
  });

  test('pending orphan removal survives a failed nested transaction that flushed', async () => {
    await orm.em.fork().insert(Author, { id: 1, name: 'a1', version: 1 });
    await orm.em.fork().insertMany(Book, [
      { id: 1, title: 'b1', author: 1 },
      { id: 2, title: 'b2', author: 1 },
    ]);

    await orm.em.fork().transactional(async em => {
      const author = await em.findOneOrFail(Author, 1, { populate: ['books'] });
      author.books.remove(author.books[0]);
      await failAfterFlush(em);
    });

    expect(await orm.em.fork().findAll(Book)).toMatchObject([{ title: 'b2' }]);
  });

  test('entities created in a failed nested transaction are not saved', async () => {
    await orm.em.fork().transactional(async em => {
      em.create(Book, { title: 'outer' });

      await expect(
        em.transactional(async inner => {
          inner.create(Book, { title: 'inner' });
          await inner.flush();
          throw new Error('Nested transaction failed');
        }),
      ).rejects.toThrow('Nested transaction failed');
    });

    expect(await orm.em.fork().findAll(Book)).toMatchObject([{ title: 'outer' }]);
  });

  test('entity removed and created again in a nested transaction keeps its references', async () => {
    await orm.em.fork().insert(Book, { id: 1, title: 'b1' });
    await orm.em.fork().insert(Tag, { id: 1, name: 't1' });

    await orm.em.fork().transactional(async em => {
      const book = await em.findOneOrFail(Book, 1, { populate: ['tags'] });
      const tag = await em.findOneOrFail(Tag, 1);

      await em.transactional(async inner => {
        await inner.remove(tag).flush();
        inner.persist(tag);
        book.tags.add(tag);
      });
    });

    const book = await orm.em.fork().findOneOrFail(Book, 1, { populate: ['tags'] });
    expect(book.tags.getItems()).toMatchObject([{ name: 't1' }]);
  });
});
