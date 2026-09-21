import type { Rel } from '@mikro-orm/sqlite';
import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Author {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Book {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Rel<Author>;
}

@Entity()
class CompositeAuthor {
  @PrimaryKey()
  tenant!: number;

  @PrimaryKey()
  code!: string;

  @Property()
  name!: string;
}

@Entity()
class CompositeBook {
  @PrimaryKey({ autoincrement: true })
  id!: number;

  @ManyToOne(() => CompositeAuthor)
  author!: Rel<CompositeAuthor>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book, CompositeAuthor, CompositeBook],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const em = orm.em.fork();
  const author = em.create(Author, { name: 'Jon' });
  em.create(Book, { title: 'b1', author });

  const compositeAuthor = em.create(CompositeAuthor, { tenant: 1, code: 'a1', name: 'Jon' });
  em.create(CompositeBook, { author: compositeAuthor });

  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test("em.find() does not mutate the caller's where object", async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(Author, { name: 'Jon' });
  const where = { author };

  await em.find(Book, where);

  expect(where.author).toBe(author);
});

test("em.find() does not mutate the caller's where object for a PK-object relation value", async () => {
  const em = orm.em.fork();
  const where = { author: { id: 1 } };

  await em.find(Book, where);

  expect(where.author).toEqual({ id: 1 });
});

test("em.find() does not mutate the caller's where object for a composite-PK relation entity", async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(CompositeAuthor, { tenant: 1, code: 'a1' });
  const where = { author };

  await em.find(CompositeBook, where);

  expect(where.author).toBe(author);
});

test("em.find() does not mutate entities nested in operators of the caller's where object", async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(Author, { name: 'Jon' });
  const where = { $or: [{ author: { $in: [author] } }, { $and: [{ author }] }] };

  await expect(em.find(Book, where)).resolves.toHaveLength(1);

  expect(where).toEqual({ $or: [{ author: { $in: [author] } }, { $and: [{ author }] }] });
  expect(where.$or[0].author!.$in![0]).toBe(author);
});

test("em.findOneOrFail() reports primary keys without mutating the caller's where object", async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(Author, { name: 'Jon' });
  const where = { author, title: 'nope' };

  await expect(em.findOneOrFail(Book, where)).rejects.toThrow("Book not found ({ author: 1, title: 'nope' })");

  expect(where.author).toBe(author);
});

test("qb.where() does not mutate the caller's where object", async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(Author, { name: 'Jon' });
  const where = { author };

  await expect(em.qb(Book).where(where).getResultList()).resolves.toHaveLength(1);

  expect(where.author).toBe(author);
});

test("em.find() does not lift group operators in the caller's where object", async () => {
  const em = orm.em.fork();
  const where = { author: { $or: [{ id: 1 }, { id: 2 }] } };

  await expect(em.find(Book, where)).resolves.toHaveLength(1);

  expect(where).toEqual({ author: { $or: [{ id: 1 }, { id: 2 }] } });
});

test("em.find() does not drop undefined properties from the caller's where object", async () => {
  const orm2 = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book],
    metadataProvider: ReflectMetadataProvider,
    ignoreUndefinedInQuery: true,
  });
  await orm2.schema.create();
  const where = { title: undefined, author: { name: undefined } };

  await orm2.em.fork().find(Book, where);

  expect(Object.keys(where)).toEqual(['title', 'author']);
  expect(Object.keys(where.author)).toEqual(['name']);
  await orm2.close(true);
});

test("write methods do not mutate the caller's data", async () => {
  const em = orm.em.fork();
  const author = await em.findOneOrFail(Author, { name: 'Jon' });
  const data = () => ({ title: 'b', author });
  const rows = [data(), data(), data(), data(), data(), data(), data(), data()];
  const [create, insert, many1, many2, update, upsert, upsertMany, qb] = rows;

  em.create(Book, create);
  await em.insert(Book, insert);
  await em.insertMany(Book, [many1, many2]);
  await em.nativeUpdate(Book, { title: 'nope' }, update);
  await em.upsert(Book, upsert);
  const upsertManyRows = [upsertMany];
  await em.upsertMany(Book, upsertManyRows);
  expect(upsertManyRows[0]).toBe(upsertMany);
  await em.qb(Book).insert(qb).execute();
  await em.qb(Book).update(qb).where({ title: 'nope' }).execute();

  for (const row of rows) {
    expect(row).toEqual({ title: 'b', author });
    expect(row.author).toBe(author);
  }
});
