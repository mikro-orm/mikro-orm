import type { Rel } from '@mikro-orm/sqlite';
import { MikroORM, Opt } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Category {
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

  @Property({ generated: cols => `(${cols.title} || '!') stored` })
  label!: string & Opt;

  @ManyToOne(() => Category)
  category!: Rel<Category>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Category, Book],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();

  const em = orm.em.fork();
  const category = em.create(Category, { name: 'bar' });
  em.create(Book, { title: 'foo', category });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('nativeUpdate with a condition on a relation and a generated column', async () => {
  const em = orm.em.fork();
  const mock = mockLogger(orm);
  await em.nativeUpdate(Book, { category: { name: 'bar' } }, { title: 'baz' });

  expect(mock.mock.calls[0][0]).toMatch(
    "update `book` set `title` = 'baz' where `id` in (select `b0`.`id` from (select distinct `b0`.`id` from `book` as `b0` inner join `category` as `c1` on `b0`.`category_id` = `c1`.`id` where `c1`.`name` = 'bar') as `b0`) returning `label`",
  );

  const book = await em.fork().findOneOrFail(Book, { title: 'baz' });
  expect(book.label).toBe('baz!');
});
