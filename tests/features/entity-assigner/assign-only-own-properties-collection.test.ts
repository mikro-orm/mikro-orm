import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Tag {

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
  title!: string;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Book, Tag],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

beforeEach(async () => {
  await orm.schema.clearDatabase();
  orm.em.create(Book, { id: 1, title: 'b' });
  orm.em.create(Tag, { id: 1, name: 't1' });
  orm.em.create(Tag, { id: 2, name: 't2' });
  await orm.em.flush();
  orm.em.clear();
});

const shapes: [string, (item: object) => unknown][] = [
  ['array', item => [item]],
  ['single item', item => item],
];

async function loadBook() {
  return orm.em.findOneOrFail(Book, 1, { populate: ['tags'] });
}

test.each(shapes)('onlyOwnProperties converts owning M:N payload to a reference (%s)', async (_, wrap) => {
  const book = await loadBook();
  orm.em.assign(book, { tags: wrap({ id: 1, name: 'renamed' }) as any }, { onlyOwnProperties: true });
  await orm.em.flush();
  orm.em.clear();

  const reloaded = await loadBook();
  expect(reloaded.tags.getItems().map(t => t.name)).toEqual(['t1']);
});

test.each(shapes)('onlyOwnProperties rejects owning M:N payload without a primary key (%s)', async (_, wrap) => {
  const book = await loadBook();
  expect(() => {
    orm.em.assign(book, { tags: wrap({ name: 'new' }) as any }, { onlyOwnProperties: true });
  }).toThrow(/Invalid collection values provided/);
  orm.em.clear();
  expect(await orm.em.count(Tag)).toBe(2);
});

test('onlyOwnProperties appends a single item and replaces with an array', async () => {
  const book = await loadBook();
  orm.em.assign(book, { tags: 1 }, { onlyOwnProperties: true });
  orm.em.assign(book, { tags: { id: 2 } as any }, { onlyOwnProperties: true });
  expect(book.tags.getIdentifiers()).toEqual([1, 2]);
  orm.em.assign(book, { tags: [orm.em.getReference(Tag, 2)] }, { onlyOwnProperties: true });
  expect(book.tags.getIdentifiers()).toEqual([2]);
});
