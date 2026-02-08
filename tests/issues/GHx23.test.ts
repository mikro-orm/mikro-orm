import { Collection, MikroORM, wrap } from '@mikro-orm/sqlite';
import { Entity, ManyToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Tag {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => Book, x => x.tags)
  books = new Collection<Book>(this);
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
    metadataProvider: ReflectMetadataProvider,
    entities: [Book],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 1003`, async () => {
  const em = orm.em.fork();

  const tag1 = em.create(Tag, { name: 'Tag 1' });
  const tag2 = em.create(Tag, { name: 'Tag 2' });
  const tag3 = em.create(Tag, { name: 'Tag 3' });

  em.create(Book, {
    title: 'Book 1',
    tags: [tag1, tag2],
  });

  await em.flush();
  em.clear();

  const subqb = em.createQueryBuilder(Tag, 't1').select(['t1.id', 't1.name']).where({ name: 'Tag 1' });

  const qb = em
    .createQueryBuilder(Book, 'b')
    .select(['b.id', 'b.title'])
    .leftJoinAndSelect(['b.tags', subqb], 't2', undefined, ['t2.id', 't2.name']);

  const result = await qb.getResultList();

  expect(result.map(b => wrap(b).toObject())).toEqual([{ id: 1, title: 'Book 1', tags: [{ id: 1, name: 'Tag 1' }] }]);
});
