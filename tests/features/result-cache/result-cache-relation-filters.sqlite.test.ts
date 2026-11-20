import {
  Collection,
  Entity,
  Filter,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/better-sqlite';
import { mockLogger } from '../../helpers';

@Entity()
@Filter({ name: 'tenant', cond: (args: { tenant: number }) => ({ tenant: args.tenant }), default: true })
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  tenant!: number;

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

}

@Entity()
class Category {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Product, product => product.category)
  products = new Collection<Product>(this);

}

@Entity()
@Filter({ name: 'tenant', cond: (args: { tenant: number }) => ({ tenant: args.tenant }), default: true })
class Product {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  tenant!: number;

  @ManyToOne(() => Category)
  category!: Category;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [Author, Book, Category, Product], dbName: ':memory:' });
  await orm.schema.createSchema();
  const em = orm.em.fork();
  const a1 = em.create(Author, { id: 1, name: 'a1', tenant: 1 });
  const a2 = em.create(Author, { id: 2, name: 'a2', tenant: 2 });
  em.create(Book, { id: 1, title: 'b1', author: a1 });
  em.create(Book, { id: 2, title: 'b2', author: a2 });
  em.create(Book, { id: 3, title: 'b3', author: a2 });
  const category = em.create(Category, { id: 1, name: 'c1' });
  em.create(Product, { id: 1, name: 'p1', tenant: 1, category });
  em.create(Product, { id: 2, name: 'p2', tenant: 2, category });
  await em.flush();
});

beforeEach(() => orm.config.getResultCacheAdapter().clear());
afterAll(() => orm.close(true));

function fork(tenant: number) {
  const em = orm.em.fork();
  em.setFilterParams('tenant', { tenant });

  return em;
}

describe.each(['select-in', 'joined'] as const)('populated relation filter params (%s)', strategy => {
  const options = { cache: true, populate: ['products'], strategy } as const;

  test('em.find', async () => {
    const [c1] = await fork(1).find(Category, {}, options);
    const [c2] = await fork(2).find(Category, {}, options);
    expect(c1.products.getItems().map(i => i.name)).toEqual(['p1']);
    expect(c2.products.getItems().map(i => i.name)).toEqual(['p2']);
  });

  test('em.findOne', async () => {
    const c1 = await fork(1).findOneOrFail(Category, { name: 'c1' }, options);
    const c2 = await fork(2).findOneOrFail(Category, { name: 'c1' }, options);
    expect(c1.products.getItems().map(i => i.name)).toEqual(['p1']);
    expect(c2.products.getItems().map(i => i.name)).toEqual(['p2']);
  });

  test('em.findAndCount', async () => {
    const [b1, count1] = await fork(1).findAndCount(Book, {}, { cache: true, populate: ['author'], strategy });
    const [b2, count2] = await fork(2).findAndCount(Book, {}, { cache: true, populate: ['author'], strategy });
    expect([b1.map(b => b.author.name), count1]).toEqual([['a1'], 1]);
    expect([b2.map(b => b.author.name), count2]).toEqual([['a2', 'a2'], 2]);
  });
});

test('to-one relation filter params without a populate hint', async () => {
  const b1 = await fork(1).find(Book, {}, { cache: true });
  const b2 = await fork(2).find(Book, {}, { cache: true });
  expect(b1.map(b => b.title)).toEqual(['b1']);
  expect(b2.map(b => b.title)).toEqual(['b2', 'b3']);
});

test('same filter params share the cache entry', async () => {
  const mock = mockLogger(orm, ['query']);
  await fork(1).find(Category, {}, { cache: true, populate: ['products'] });
  const queries = mock.mock.calls.length;
  await fork(1).find(Category, {}, { cache: true, populate: ['products'] });
  expect(mock.mock.calls).toHaveLength(queries);
});

test('queries without relations share the cache entry across filter params', async () => {
  const mock = mockLogger(orm, ['query']);
  await fork(1).find(Category, {}, { cache: true, populate: false });
  expect(mock.mock.calls).toHaveLength(1);
  await fork(2).find(Category, {}, { cache: true, populate: false });
  expect(mock.mock.calls).toHaveLength(1);
});
