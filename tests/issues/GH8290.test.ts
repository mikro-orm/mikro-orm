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
