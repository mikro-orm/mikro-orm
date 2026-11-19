import { Collection, MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Book {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  title!: string;

  @ManyToMany(() => Tag)
  tags = new Collection<Tag>(this);
}

@Entity()
class Tag {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @ManyToMany(() => Book, b => b.tags)
  books = new Collection<Book>(this);
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Book, Tag],
    dbName: 'remove-many-collection-items',
    clientUrl: 'mongodb://localhost:27017',
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  const tags = Array.from({ length: 6 }, (_, i) => orm.em.create(Tag, { name: `t${i + 1}` }));
  orm.em.create(Book, { title: 'b1', tags });
  orm.em.create(Book, { title: 'b2', tags: tags.slice(2) });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

function expectIndexes(coll: Collection<Tag>, names: string[]) {
  const items = coll.getItems(false);
  expect(items.map(t => t.name)).toEqual(names);
  expect(coll.length).toBe(names.length);
  expect(coll.count()).toBe(names.length);
  expect(Object.keys(coll).filter(key => /^\d+$/.test(key))).toEqual(names.map((_, i) => String(i)));
  items.forEach((item, i) => expect((coll as any)[i]).toBe(item));
}

test('em.remove() of many inverse M:N items updates the array indexes of each owner collection', async () => {
  const [b1, b2] = await orm.em.find(Book, {}, { populate: ['tags'], orderBy: { title: 'asc' } });
  const tags = await orm.em.find(Tag, {}, { populate: ['books'], orderBy: { name: 'asc' } });
  const reindex = vi.spyOn(Collection.prototype, 'reindex');

  orm.em.remove([tags[0], tags[2], tags[3], tags[5]]);
  expect(reindex).toHaveBeenCalledTimes(2);
  reindex.mockRestore();
  expectIndexes(b1.tags, ['t2', 't5']);
  expectIndexes(b2.tags, ['t5']);
  expect(b1.tags.isDirty()).toBe(true);
  expect(b2.tags.isDirty()).toBe(true);

  await orm.em.flush();
  expectIndexes(b1.tags, ['t2', 't5']);
  expectIndexes(b2.tags, ['t5']);

  const [r1, r2] = await orm.em.fork().find(Book, {}, { populate: ['tags'], orderBy: { title: 'asc' } });
  expect(
    r1.tags
      .getItems()
      .map(t => t.name)
      .sort(),
  ).toEqual(['t2', 't5']);
  expect(r2.tags.getItems().map(t => t.name)).toEqual(['t5']);
  expect(await orm.em.fork().count(Tag)).toBe(2);
});
