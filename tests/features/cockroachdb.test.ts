import { defineEntity, LoadStrategy, MikroORM, p } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { SeedManager } from '@mikro-orm/seeder';
import { EntityGenerator } from '@mikro-orm/entity-generator';

// CockroachDB entities using UUID primary keys via defineEntity.
// CockroachDB's `serial` produces INT8 values, so UUID PKs are the simplest choice.
// Alternatively, `p.bigint('string')` can be used for serial PKs.

const CrdbAuthor = defineEntity({
  name: 'CrdbAuthor',
  tableName: 'crdb_author',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    name: p.string(),
    email: p.string().unique(),
    age: p.integer().nullable(),
    termsAccepted: p.boolean().default(false),
    identities: p.array().nullable(),
    identity: p.json<Record<string, unknown>>().nullable(),
    createdAt: p.datetime().defaultRaw('current_timestamp(3)').columnType('timestamptz(3)'),
    favouriteAuthor: () => p.manyToOne(CrdbAuthor).nullable().deleteRule('set null'),
    books: () => p.oneToMany(CrdbBook).mappedBy('author'),
    address: () => p.oneToOne(CrdbAddress).mappedBy('author').nullable(),
  },
});

const CrdbBook = defineEntity({
  name: 'CrdbBook',
  tableName: 'crdb_book',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    title: p.string(),
    author: () => p.manyToOne(CrdbAuthor),
    publisher: () => p.manyToOne(CrdbPublisher).nullable(),
    tags: () => p.manyToMany(CrdbTag).inversedBy('books').pivotTable('crdb_book_tags'),
  },
});

const CrdbPublisher = defineEntity({
  name: 'CrdbPublisher',
  tableName: 'crdb_publisher',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    name: p.string(),
    type: p.enum(() => ({ local: 'local', global: 'global' }) as const),
  },
});

const CrdbTag = defineEntity({
  name: 'CrdbTag',
  tableName: 'crdb_tag',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    name: p.string(),
    books: () => p.manyToMany(CrdbBook).mappedBy('tags'),
  },
});

const CrdbAddress = defineEntity({
  name: 'CrdbAddress',
  tableName: 'crdb_address',
  properties: {
    author: () => p.oneToOne(CrdbAuthor).primary().updateRule('cascade').deleteRule('cascade'),
    value: p.string(),
  },
});

const CrdbFooBar = defineEntity({
  name: 'CrdbFooBar',
  tableName: 'crdb_foo_bar',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    name: p.string(),
    version: p.datetime().version().columnType('timestamptz(0)').defaultRaw('current_timestamp(0)'),
    baz: () => p.oneToOne(CrdbFooBaz).nullable().unique().deleteRule('set null'),
  },
});

const CrdbFooBaz = defineEntity({
  name: 'CrdbFooBaz',
  tableName: 'crdb_foo_baz',
  properties: {
    id: p.uuid().primary().defaultRaw('gen_random_uuid()'),
    name: p.string(),
    code: p.string(),
    version: p.datetime().version().columnType('timestamptz(3)').defaultRaw('current_timestamp(3)'),
  },
});

const CrdbFooParam = defineEntity({
  name: 'CrdbFooParam',
  tableName: 'crdb_foo_param',
  primaryKeys: ['bar', 'baz'],
  properties: {
    bar: () => p.manyToOne(CrdbFooBar).primary().updateRule('cascade'),
    baz: () => p.manyToOne(CrdbFooBaz).primary().updateRule('cascade'),
    value: p.string(),
    version: p.datetime().version().columnType('timestamptz(3)').defaultRaw('current_timestamp(3)'),
  },
});

const allEntities = [CrdbAuthor, CrdbBook, CrdbPublisher, CrdbTag, CrdbAddress, CrdbFooBar, CrdbFooBaz, CrdbFooParam];

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: allEntities,
    dbName: `mikro_orm_crdb_${(Math.random() + 1).toString(36).substring(7)}`,
    port: 26257,
    user: 'root',
    password: '',
    logger: i => i,
    extensions: [Migrator, SeedManager, EntityGenerator],
  });

  await orm.schema.create();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

beforeEach(async () => {
  // CockroachDB doesn't support `truncate ... restart identity`, so we use
  // `truncate: false` to fall back to ordered `delete from` statements.
  await orm.schema.clear({ truncate: false });
});

describe('CockroachDB compatibility', () => {

  test('basic connection works', async () => {
    const conn = orm.em.getConnection();
    const result = await conn.execute('SELECT version()');
    expect(result[0].version).toMatch(/CockroachDB/);
  });

  test('create and read entity', async () => {
    const em = orm.em.fork();
    const publisher = em.create(CrdbPublisher, {
      name: 'Test Publisher',
      type: 'local',
    });
    await em.flush();
    expect(publisher.id).toBeDefined();

    const em2 = orm.em.fork();
    const found = await em2.findOneOrFail(CrdbPublisher, publisher.id);
    expect(found.name).toBe('Test Publisher');
    expect(found.type).toBe('local');
  });

  test('create author with book and relations', async () => {
    const em = orm.em.fork();
    const author = em.create(CrdbAuthor, {
      name: 'CockroachDB Author',
      email: 'crdb@test.com',
      termsAccepted: true,
    });
    const book = em.create(CrdbBook, {
      title: 'Testing CockroachDB',
      author,
    });
    await em.flush();

    const em2 = orm.em.fork();
    const foundBook = await em2.findOneOrFail(CrdbBook, book.id, {
      populate: ['author'],
    });
    expect(foundBook.title).toBe('Testing CockroachDB');
    expect(foundBook.author.name).toBe('CockroachDB Author');
  });

  test('update entity', async () => {
    const em = orm.em.fork();
    const author = em.create(CrdbAuthor, {
      name: 'Original Name',
      email: 'update@test.com',
      termsAccepted: true,
    });
    await em.flush();

    author.name = 'Updated Name';
    author.age = 42;
    await em.flush();

    const em2 = orm.em.fork();
    const found = await em2.findOneOrFail(CrdbAuthor, author.id);
    expect(found.name).toBe('Updated Name');
    // CockroachDB maps int4 to int8, pg returns bigints as strings
    expect(Number(found.age)).toBe(42);
  });

  test('delete entity', async () => {
    const em = orm.em.fork();
    const author = em.create(CrdbAuthor, {
      name: 'To Delete',
      email: 'delete@test.com',
      termsAccepted: true,
    });
    await em.flush();
    const id = author.id;

    em.remove(author);
    await em.flush();

    const em2 = orm.em.fork();
    const found = await em2.findOne(CrdbAuthor, id);
    expect(found).toBeNull();
  });

  test('QueryBuilder with conditions and ordering', async () => {
    const em = orm.em.fork();
    em.create(CrdbAuthor, { name: 'Alice', email: 'alice@test.com', termsAccepted: true, age: 30 });
    em.create(CrdbAuthor, { name: 'Bob', email: 'bob@test.com', termsAccepted: true, age: 25 });
    em.create(CrdbAuthor, { name: 'Charlie', email: 'charlie@test.com', termsAccepted: true, age: 35 });
    await em.flush();

    const em2 = orm.em.fork();
    const qb = em2.createQueryBuilder(CrdbAuthor, 'a');
    const authors = await qb
      .select(['a.id', 'a.name', 'a.email'])
      .where({ age: { $gte: 30 } })
      .orderBy({ name: 'asc' })
      .getResultList();

    expect(authors).toHaveLength(2);
    expect(authors[0].name).toBe('Alice');
    expect(authors[1].name).toBe('Charlie');
  });

  test('transactions', async () => {
    await orm.em.fork().transactional(async em => {
      em.create(CrdbTag, { name: 'tag-in-tx-1' });
      em.create(CrdbTag, { name: 'tag-in-tx-2' });
      await em.flush();
    });

    const em2 = orm.em.fork();
    const tags = await em2.find(CrdbTag, { name: { $like: 'tag-in-tx-%' } });
    expect(tags).toHaveLength(2);
  });

  test('transaction rollback', async () => {
    try {
      await orm.em.fork().transactional(async em => {
        em.create(CrdbTag, { name: 'tag-rollback' });
        await em.flush();
        throw new Error('Intentional rollback');
      });
    } catch {
      // expected
    }

    const em2 = orm.em.fork();
    const tags = await em2.find(CrdbTag, { name: 'tag-rollback' });
    expect(tags).toHaveLength(0);
  });

  test('batch insert', async () => {
    const em = orm.em.fork();
    for (let i = 0; i < 10; i++) {
      em.create(CrdbTag, { name: `batch-${i}` });
    }
    await em.flush();

    const em2 = orm.em.fork();
    const count = await em2.count(CrdbTag, { name: { $like: 'batch-%' } });
    expect(count).toBe(10);
  });

  test('JSON operations', async () => {
    const em = orm.em.fork();
    em.create(CrdbAuthor, {
      name: 'JSON Author',
      email: 'json@test.com',
      termsAccepted: true,
      identity: { foo: 'bar', nested: { key: 'value' } },
    });
    await em.flush();

    const em2 = orm.em.fork();
    const found = await em2.findOneOrFail(CrdbAuthor, { email: 'json@test.com' });
    expect(found.identity).toEqual({ foo: 'bar', nested: { key: 'value' } });
  });

  test('array column operations', async () => {
    const em = orm.em.fork();
    em.create(CrdbAuthor, {
      name: 'Array Author',
      email: 'array@test.com',
      termsAccepted: true,
      identities: ['id1', 'id2', 'id3'],
    });
    await em.flush();

    const em2 = orm.em.fork();
    const found = await em2.findOneOrFail(CrdbAuthor, { email: 'array@test.com' });
    expect(found.identities).toEqual(['id1', 'id2', 'id3']);
  });

  test('upsert', async () => {
    const em = orm.em.fork();
    const upserted = await em.upsert(CrdbAuthor, {
      name: 'Upsert Author',
      email: 'upsert@test.com',
      termsAccepted: true,
    });
    expect(upserted.id).toBeDefined();
    const id = upserted.id;

    // upsert same email should update
    const upserted2 = await em.upsert(CrdbAuthor, {
      name: 'Upsert Author Updated',
      email: 'upsert@test.com',
      termsAccepted: true,
    });
    expect(upserted2.id).toBe(id);
    expect(upserted2.name).toBe('Upsert Author Updated');
  });

  test('joined loading strategy', async () => {
    const em = orm.em.fork();
    const author = em.create(CrdbAuthor, {
      name: 'Joined Author',
      email: 'joined@test.com',
      termsAccepted: true,
    });
    const publisher = em.create(CrdbPublisher, {
      name: 'Joined Publisher',
      type: 'global',
    });
    const book = em.create(CrdbBook, {
      title: 'Joined Book',
      author,
      publisher,
    });
    const tag = em.create(CrdbTag, { name: 'joined-tag' });
    book.tags.add(tag);
    await em.flush();

    const em2 = orm.em.fork();
    const books = await em2.find(CrdbBook, {}, {
      populate: ['author', 'publisher', 'tags'],
      strategy: LoadStrategy.JOINED,
    });

    expect(books).toHaveLength(1);
    expect(books[0].title).toBe('Joined Book');
    expect(books[0].author.name).toBe('Joined Author');
    expect(books[0].publisher!.name).toBe('Joined Publisher');
    expect(books[0].tags.length).toBe(1);
  });

  test('pagination with findAndCount', async () => {
    const em = orm.em.fork();
    for (let i = 0; i < 10; i++) {
      em.create(CrdbTag, { name: `page-tag-${String(i).padStart(2, '0')}` });
    }
    await em.flush();

    const em2 = orm.em.fork();
    const [tags, total] = await em2.findAndCount(CrdbTag, { name: { $like: 'page-tag-%' } }, {
      limit: 3,
      offset: 2,
      orderBy: { name: 'asc' },
    });

    expect(total).toBe(10);
    expect(tags).toHaveLength(3);
    expect(tags[0].name).toBe('page-tag-02');
    expect(tags[2].name).toBe('page-tag-04');
  });

  test('many-to-many relation', async () => {
    const em = orm.em.fork();
    const author = em.create(CrdbAuthor, {
      name: 'M2M Author',
      email: 'm2m@test.com',
      termsAccepted: true,
    });
    const book = em.create(CrdbBook, { title: 'M2M Book', author });
    const tag1 = em.create(CrdbTag, { name: 'm2m-tag-1' });
    const tag2 = em.create(CrdbTag, { name: 'm2m-tag-2' });
    const tag3 = em.create(CrdbTag, { name: 'm2m-tag-3' });
    book.tags.add(tag1, tag2, tag3);
    await em.flush();

    const em2 = orm.em.fork();
    const foundBook = await em2.findOneOrFail(CrdbBook, book.id, {
      populate: ['tags'],
    });
    expect(foundBook.tags.length).toBe(3);
    const tagNames = foundBook.tags.getItems().map(t => t.name).sort();
    expect(tagNames).toEqual(['m2m-tag-1', 'm2m-tag-2', 'm2m-tag-3']);
  });

  test('self-referencing relations', async () => {
    const em = orm.em.fork();
    const author1 = em.create(CrdbAuthor, {
      name: 'Author 1',
      email: 'self1@test.com',
      termsAccepted: true,
    });
    const author2 = em.create(CrdbAuthor, {
      name: 'Author 2',
      email: 'self2@test.com',
      termsAccepted: true,
      favouriteAuthor: author1,
    });
    await em.flush();

    const em2 = orm.em.fork();
    const found = await em2.findOneOrFail(CrdbAuthor, author2.id, {
      populate: ['favouriteAuthor'],
    });
    expect(found.favouriteAuthor!.name).toBe('Author 1');
  });

  test('schema generator - getUpdateSchemaSQL', async () => {
    const updateSql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(typeof updateSql).toBe('string');
  });

  test('schema generator - getCreateSchemaSQL', async () => {
    const createSql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSql).toContain('create table');
    expect(createSql.length).toBeGreaterThan(100);
  });

  test('one-to-one relation with cascade', async () => {
    const em = orm.em.fork();
    const author = em.create(CrdbAuthor, {
      name: 'Address Author',
      email: 'address@test.com',
      termsAccepted: true,
    });
    await em.flush();

    em.create(CrdbAddress, {
      author,
      value: '123 CockroachDB Lane',
    });
    await em.flush();

    const em2 = orm.em.fork();
    const found = await em2.findOneOrFail(CrdbAuthor, author.id, {
      populate: ['address'],
    });
    expect(found.address!.value).toBe('123 CockroachDB Lane');
  });

  test('optimistic locking with version field', async () => {
    const em = orm.em.fork();
    const bar = em.create(CrdbFooBar, { name: 'versioned-bar' });
    await em.flush();
    const version1 = bar.version;

    // Wait to ensure timestamp changes (timestamptz(0) has second precision)
    await new Promise(r => setTimeout(r, 1100));

    bar.name = 'versioned-bar-updated';
    await em.flush();
    expect(bar.version).not.toEqual(version1);
  });

  test('composite primary key', async () => {
    const em = orm.em.fork();
    const bar = em.create(CrdbFooBar, { name: 'comp-bar' });
    const baz = em.create(CrdbFooBaz, { name: 'comp-baz', code: 'CZ' });
    await em.flush();

    em.create(CrdbFooParam, {
      bar,
      baz,
      value: 'test-value',
    });
    await em.flush();

    const em2 = orm.em.fork();
    const found = await em2.findOneOrFail(CrdbFooParam, [bar.id, baz.id]);
    expect(found.value).toBe('test-value');
  });

});
