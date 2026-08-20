import { type EntityCtor, MetadataStorage, ReferenceKind, type Ref } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

// Minifiers (e.g. Turbopack) can mangle two entity classes from different module scopes
// to the same short name. The decorator metadata registry must not collide on class name.
function defineBase() {
  class d {
    @PrimaryKey({ type: 'number' })
    id!: number;
  }

  return d;
}

const Base = defineBase();

function defineSocial() {
  @Embeddable()
  class d {
    @Property({ type: 'string', nullable: true })
    twitter?: string;
  }

  return d;
}

const Social = defineSocial();

function defineAuthor(base: typeof Base, social: typeof Social) {
  @Entity({ tableName: 'gh8107_author' })
  class d extends base {
    @Property({ type: 'string' })
    name!: string;

    @Embedded({ entity: () => social, object: true, nullable: true })
    social?: InstanceType<typeof Social>;
  }

  return d;
}

const Author = defineAuthor(Base, Social);

function defineBook(base: typeof Base, author: typeof Author) {
  @Entity({ tableName: 'gh8107_book' })
  class d extends base {
    @Property({ type: 'string' })
    title!: string;

    @ManyToOne({ entity: () => author, ref: true })
    author!: Ref<InstanceType<typeof Author>>;
  }

  return d;
}

const Book = defineBook(Base, Author);

test('discovery works when two entity classes share a mangled class name', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book, Social],
  });

  const authorMeta = orm.getMetadata().get(Author);
  const bookMeta = orm.getMetadata().get(Book);
  expect(authorMeta.tableName).toBe('gh8107_author');
  expect(bookMeta.tableName).toBe('gh8107_book');
  expect(Object.keys(authorMeta.properties)).toEqual(expect.arrayContaining(['id', 'name', 'social']));
  expect(Object.keys(bookMeta.properties)).toEqual(['id', 'title', 'author']);
  expect(authorMeta.properties.social.embeddable).toBe(Social);

  await orm.schema.create();

  const author = orm.em.create(Author, { name: 'Jon', social: { twitter: '@jon' } });
  orm.em.create(Book, { title: 'B1', author });
  await orm.em.flush();
  orm.em.clear();

  const book = await orm.em.findOneOrFail(Book, { title: 'B1' }, { populate: ['author'] });
  expect(book.author.$.name).toBe('Jon');
  expect(book.author.$.social?.twitter).toBe('@jon');

  await orm.close(true);
});

test('auto-discovery of referenced entities works when class names collide', async () => {
  // `Author` and `Social` are not listed in `entities`, they are discovered
  // via the `Book.author` relation and the `Author.social` embedded property
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Book],
  });

  expect(orm.getMetadata().get(Book).tableName).toBe('gh8107_book');
  expect(orm.getMetadata().get(Author).tableName).toBe('gh8107_author');
  expect(orm.getMetadata().get(Book).properties.author.targetMeta?.tableName).toBe('gh8107_author');
  expect(orm.getMetadata().get(Author).properties.social.embeddable).toBe(Social);

  await orm.close(true);
});

test('discovery falls back to the name-keyed registry (older decorators versions)', async () => {
  // simulate a class decorated by an older @mikro-orm/decorators version, which registered
  // the metadata only under the `className-path` key and stored just the path on the class
  class OldStyle {}
  const meta = MetadataStorage.getMetadata('OldStyle', '/gh8107/old-style');
  meta.class = OldStyle as EntityCtor;
  meta.name = 'OldStyle';
  meta.properties.id = {
    name: 'id',
    kind: ReferenceKind.SCALAR,
    type: 'number',
    primary: true,
  } as (typeof meta.properties)[string];
  Object.defineProperty(OldStyle, MetadataStorage.PATH_SYMBOL, { value: '/gh8107/old-style', writable: true });

  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [OldStyle],
  });

  expect(orm.getMetadata().get<any>(OldStyle).properties.id.primary).toBe(true);
  await orm.close(true);
});
