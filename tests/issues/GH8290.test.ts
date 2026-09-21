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

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const em = orm.em.fork();
  const author = em.create(Author, { name: 'Jon' });
  em.create(Book, { title: 'b1', author });
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
