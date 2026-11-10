import {
  MikroORM,
  defineEntity,
  p,
  ref,
  serialize,
  ValidationError,
  wrap,
  type EntityDictionary,
  type EntityName,
  type InferEntity,
  type Ref,
} from '@mikro-orm/sqlite';

const Author = defineEntity({
  name: 'Author',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    books: () => p.oneToMany(Book).mappedBy('author'),
  },
});

const Publisher = defineEntity({
  name: 'Publisher',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

const Cover = defineEntity({
  name: 'Cover',
  properties: {
    id: p.integer().primary(),
    url: p.string(),
  },
});

const Address = defineEntity({
  name: 'Address',
  embeddable: true,
  properties: {
    line: p.string(),
    city: p.string(),
  },
});

const BookMeta = defineEntity({
  name: 'BookMeta',
  embeddable: true,
  properties: {
    tag: p.string(),
    score: p.integer(),
  },
});

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    title: p.string(),
    author: () => p.manyToOne(Author).ref(),
    publisher: () => p.manyToOne(Publisher).nullable(),
    cover: () => p.oneToOne(Cover).owner().ref().nullable(),
    address: () => p.embedded(Address),
    meta: () => p.embedded(BookMeta).object(),
    price: p.decimal('number').precision(10).scale(3),
    createdAt: p.datetime(),
  },
});

const Order = defineEntity({
  name: 'Order',
  properties: {
    shop: p.integer().primary(),
    number: p.integer().primary(),
  },
});

const OrderItem = defineEntity({
  name: 'OrderItem',
  properties: {
    id: p.integer().primary(),
    order: () => p.manyToOne(Order).ref(),
  },
});

const Animal = defineEntity({
  name: 'Animal',
  abstract: true,
  discriminatorColumn: 'type',
  properties: {
    id: p.integer().primary(),
    type: p.enum(['dog', 'cat']),
    name: p.string(),
    owner: () => p.manyToOne(Author).nullable(),
  },
});

const Dog = defineEntity({
  name: 'Dog',
  extends: Animal,
  discriminatorValue: 'dog',
  properties: {
    barks: p.boolean().nullable(),
  },
});

const Cat = defineEntity({
  name: 'Cat',
  extends: Animal,
  discriminatorValue: 'cat',
  properties: {
    meows: p.boolean().nullable(),
  },
});

const Pet = defineEntity({
  name: 'Pet',
  embeddable: true,
  abstract: true,
  discriminatorColumn: 'kind',
  properties: {
    kind: p.enum(['fish', 'bird']),
    name: p.string(),
  },
});

const Fish = defineEntity({
  name: 'Fish',
  embeddable: true,
  extends: Pet,
  discriminatorValue: 'fish',
  properties: {
    kind: p.enum(['fish']),
    fins: p.integer().nullable(),
  },
});

const Bird = defineEntity({
  name: 'Bird',
  embeddable: true,
  extends: Pet,
  discriminatorValue: 'bird',
  properties: {
    kind: p.enum(['bird']),
    wings: p.integer().nullable(),
  },
});

const Owner = defineEntity({
  name: 'Owner',
  properties: {
    id: p.integer().primary(),
    pet: () => p.embedded([Fish, Bird]),
    pet2: () => p.embedded([Fish, Bird]).object(),
  },
});

const Tenant = defineEntity({
  name: 'Tenant',
  properties: {
    id: p.integer().primary(),
    code: p.string().unique(),
    serial: p.bigint().unique().nullable(),
  },
});

const Membership = defineEntity({
  name: 'Membership',
  properties: {
    id: p.integer().primary(),
    tenant: () => p.manyToOne(Tenant).targetKey('code').ref(),
    tenantBySerial: () => p.manyToOne(Tenant).targetKey('serial').ref().nullable(),
  },
});

const ReviewSchema = defineEntity({
  name: 'Review',
  forceConstructor: true,
  properties: {
    id: p.integer().primary(),
    author: () => p.manyToOne(Author).ref(),
  },
});

class Review extends ReviewSchema.class {
  constructor(author: Ref<InferEntity<typeof Author>>) {
    super();
    this.author = author;
  }
}

ReviewSchema.setClass(Review);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [
      Author,
      Publisher,
      Cover,
      Book,
      Order,
      OrderItem,
      Animal,
      Dog,
      Cat,
      Pet,
      Fish,
      Bird,
      Owner,
      Tenant,
      Membership,
      Review,
    ],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const em = orm.em.fork();
  em.create(Author, { id: 1, name: 'Jon' });
  em.create(Publisher, { id: 2, name: 'Pub' });
  em.create(Cover, { id: 3, url: 'cover.png' });
  em.create(Book, {
    id: 10,
    title: 'B1',
    author: 1,
    publisher: 2,
    cover: 3,
    address: { line: 'Main 1', city: 'Prague' },
    meta: { tag: 'x', score: 5 },
    price: 120,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
  em.create(Order, { shop: 1, number: 7 });
  em.create(OrderItem, { id: 1, order: [1, 7] });
  em.create(Dog, { id: 1, name: 'Rex', barks: true, owner: 1 });
  em.create(Cat, { id: 2, name: 'Tom', meows: true });
  em.create(Owner, {
    id: 1,
    pet: { kind: 'fish', name: 'Nemo', fins: 3 },
    pet2: { kind: 'bird', name: 'Tweety', wings: 2 },
  });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

async function rawRows<T extends object>(entityName: EntityName<T>) {
  const meta = orm.getMetadata().get(entityName);
  return orm.em.execute(`select * from \`${meta.tableName}\` order by 1`);
}

/** maps the rows both ways and returns the unmanaged entities, asserting their serialized form is the same */
async function mapBothWays<T extends object>(entityName: EntityName<T>) {
  const rows = await rawRows(entityName);
  const em = orm.em.fork();
  const unmanaged = rows.map(row => em.map(entityName, { ...row } as EntityDictionary<T>, { managed: false }));
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);

  const managed = rows.map(row => orm.em.fork().map(entityName, { ...row } as EntityDictionary<T>));
  expect(unmanaged.map(e => wrap(e).toObject())).toEqual(managed.map(e => wrap(e).toObject()));
  expect(unmanaged.map(e => serialize(e))).toEqual(managed.map(e => serialize(e)));

  for (const [i, entity] of unmanaged.entries()) {
    expect(entity.constructor).toBe(managed[i].constructor);
    expect(wrap(entity).isManaged()).toBe(false);
    expect(wrap(managed[i]).isManaged()).toBe(true);
  }

  return unmanaged;
}

test('maps a detached entity without touching the identity map', async () => {
  const [row] = await rawRows(Book);
  const em = orm.em.fork();
  const book = em.map(Book, row, { managed: false });

  expect(book).toBeInstanceOf(Book.class);
  expect(wrap(book).isManaged()).toBe(false);
  expect(wrap(book).isInitialized()).toBe(true);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);

  // relations are detached references
  expect(book.author.unwrap()).toBeInstanceOf(Author.class);
  expect(book.author.id).toBe(1);
  expect(book.author.isInitialized()).toBe(false);
  expect(wrap(book.author).isManaged()).toBe(false);
  expect(book.publisher).toBeInstanceOf(Publisher.class);
  expect(wrap(book.publisher!).isManaged()).toBe(false);
  expect(book.cover!.id).toBe(3);
  expect(wrap(book.cover!).isManaged()).toBe(false);

  // embeddables and custom types are hydrated
  expect(book.address).toBeInstanceOf(Address.class);
  expect(book.address).toEqual({ line: 'Main 1', city: 'Prague' });
  expect(book.meta).toBeInstanceOf(BookMeta.class);
  expect(book.meta).toEqual({ tag: 'x', score: 5 });
  expect(book.price).toBe(120);
  expect(book.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));

  // existing managed entities are not reused either
  const author = em.map(Author, { id: 1, name: 'Jon' });
  const book2 = em.map(Book, row, { managed: false });
  expect(book2.author.unwrap()).not.toBe(author);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([author]);
});

test('custom types are converted from the raw value', () => {
  const em = orm.em.fork();
  const book = em.map(
    Book,
    {
      id: 1,
      title: 't',
      author_id: 1,
      address_line: 'l',
      address_city: 'c',
      meta: '{"tag":"t","score":1}',
      price: '120.000',
      created_at: 0,
    } as any,
    { managed: false },
  );

  expect(book.price).toBe(120);
  expect(book.meta).toEqual({ tag: 't', score: 1 });
  expect(book.address).toEqual({ line: 'l', city: 'c' });
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);
});

test('mapping the same primary key twice yields distinct entities', async () => {
  const em = orm.em.fork();
  const before = em.map(Author, { id: 1, name: 'before' }, { managed: false });
  const after = em.map(Author, { id: 1, name: 'after' }, { managed: false });

  expect(Object.is(after, before)).toBe(false);
  expect(before.name).toBe('before');
  expect(after.name).toBe('after');

  const [row] = await rawRows(Book);
  const b1 = em.map(Book, row, { managed: false });
  const b2 = em.map(Book, row, { managed: false });
  expect(b1).not.toBe(b2);
  expect(Object.is(b1.author.unwrap(), b2.author.unwrap())).toBe(false);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);
});

test('serializes the same as a managed entity', async () => {
  const [book] = await mapBothWays(Book);
  expect(wrap(book).toObject()).toEqual({
    id: 10,
    title: 'B1',
    author: 1,
    publisher: 2,
    cover: 3,
    address: { line: 'Main 1', city: 'Prague' },
    meta: { tag: 'x', score: 5 },
    price: 120,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });
  expect(wrap(book).toJSON()).toEqual(wrap(book).toObject());
});

test('composite foreign keys', async () => {
  const [item] = await mapBothWays(OrderItem);
  expect(item.order.unwrap()).toBeInstanceOf(Order.class);
  expect(item.order.unwrap()).toMatchObject({ shop: 1, number: 7 });
  expect(wrap(item.order).isManaged()).toBe(false);
  expect(wrap(item).toObject()).toEqual({ id: 1, order: { shop: 1, number: 7 } });

  const [order] = await mapBothWays(Order);
  expect(order).toMatchObject({ shop: 1, number: 7 });
});

test('single table inheritance discriminator', async () => {
  const [dog, cat] = await mapBothWays(Animal);
  expect(dog).toBeInstanceOf(Dog.class);
  expect(dog).toMatchObject({ id: 1, name: 'Rex', type: 'dog', barks: true });
  expect(wrap(dog.owner!).isManaged()).toBe(false);
  expect(cat).toBeInstanceOf(Cat.class);
  expect(cat).toMatchObject({ id: 2, name: 'Tom', type: 'cat', meows: true });
});

test('polymorphic embeddables', async () => {
  const [owner] = await mapBothWays(Owner);
  expect(owner.pet).toBeInstanceOf(Fish.class);
  expect(owner.pet).toMatchObject({ kind: 'fish', name: 'Nemo', fins: 3 });
  expect(owner.pet2).toBeInstanceOf(Bird.class);
  expect(owner.pet2).toMatchObject({ kind: 'bird', name: 'Tweety', wings: 2 });
});

test('references by target key', () => {
  const em = orm.em.fork();
  const m1 = em.map(Membership, { id: 1, tenant: 'acme' } as any, { managed: false });
  const m2 = em.map(Membership, { id: 2, tenant: 'acme' } as any, { managed: false });

  expect(m1.tenant.unwrap()).toBeInstanceOf(Tenant.class);
  expect(m1.tenant.unwrap().code).toBe('acme');
  expect(m1.tenant.unwrap()).not.toBe(m2.tenant.unwrap());
  expect(wrap(m1.tenant).isManaged()).toBe(false);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);

  // the target key value is converted via its custom type
  const m3 = em.map(Membership, { id: 3, tenant: 'acme', tenant_by_serial_id: '42' } as any, { managed: false });
  expect(m3.tenantBySerial!.unwrap().serial).toBe(42n);
  expect(wrap(m3.tenantBySerial!).isManaged()).toBe(false);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);
});

test('entities created via constructor get detached relations', () => {
  const em = orm.em.fork();
  const author = em.map(Author, { id: 1, name: 'Jon' });
  const review = em.map(Review, { id: 1, author_id: 1 } as any, { managed: false });

  expect(review).toBeInstanceOf(Review);
  expect(wrap(review).isManaged()).toBe(false);
  expect(review.author.unwrap()).not.toBe(author);
  expect(review.author.id).toBe(1);
  expect(wrap(review.author).isManaged()).toBe(false);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([author]);
});

test('works with already mapped results and takes precedence over disableIdentityMap', () => {
  const em = orm.em.fork();
  const book = em.map(
    Book,
    {
      id: 1,
      title: 't',
      author: 1,
      address: { line: 'l', city: 'c' },
      meta: { tag: 't', score: 1 },
      price: '1.500',
      createdAt: new Date(0),
    } as any,
    { managed: false, mapped: true, disableIdentityMap: true },
  );

  expect(wrap(book).isManaged()).toBe(false);
  expect(wrap(book.author).isManaged()).toBe(false);
  expect(book.price).toBe(1.5);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);
});

test('nested relation data is hydrated as detached entities', () => {
  const em = orm.em.fork();
  const book = em.map(
    Book,
    {
      id: 1,
      title: 't',
      author: { id: 1, name: 'Jon' },
      address: { line: 'l', city: 'c' },
      meta: { tag: 't', score: 1 },
      price: 1,
      createdAt: new Date(0),
    } as any,
    { managed: false, mapped: true },
  );

  expect(book.author.isInitialized()).toBe(true);
  expect(book.author.unwrap().name).toBe('Jon');
  expect(wrap(book.author).isManaged()).toBe(false);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);
});

test('nested relation data serializes the same as a managed entity', () => {
  const book = () => ({
    id: 1,
    title: 't',
    author: { id: 1, name: 'Jon' },
    publisher: { id: 2, name: 'Pub' },
    address: { line: 'l', city: 'c' },
    meta: { tag: 't', score: 1 },
    price: 1,
    createdAt: new Date(0),
  });
  const author = () => ({ id: 1, name: 'Jon', books: [{ ...book(), author: 1 }] });

  for (const [entityName, data] of [
    [Book, book],
    [Author, author],
  ] as const) {
    const unmanaged = orm.em.fork().map(entityName as EntityName<any>, data(), { managed: false, mapped: true });
    const managed = orm.em.fork().map(entityName as EntityName<any>, data(), { mapped: true });

    expect(wrap(unmanaged).toObject()).toEqual(wrap(managed).toObject());
    expect(wrap(unmanaged).toJSON()).toEqual(wrap(managed).toJSON());
    expect(serialize(unmanaged)).toEqual(serialize(managed));
  }

  // explicit populate hints still expand the relations
  const unmanaged = orm.em.fork().map(Book, book() as any, { managed: false, mapped: true });
  expect(serialize(unmanaged, { populate: ['author'] }).author).toEqual({ id: 1, name: 'Jon' });
});

test('unmanaged references cannot be loaded', async () => {
  const [row] = await rawRows(Book);
  const em = orm.em.fork();
  const book = em.map(Book, row, { managed: false });
  const message =
    'Cannot load unmanaged reference Author(1). It was created without an EntityManager ' +
    '(e.g. via `em.map(..., { managed: false })`), load it via `em.findOne()` or map the result as managed instead.';

  await expect(book.author.load()).rejects.toThrow(ValidationError);
  await expect(book.author.load()).rejects.toThrow(message);
  await expect(book.author.loadOrFail()).rejects.toThrow(message);
  await expect(wrap(book.publisher!).init()).rejects.toThrow('Cannot load unmanaged reference Publisher(2)');

  // they can still be used to look up the managed entity explicitly
  const author = await em.findOneOrFail(Author, book.author.id);
  expect(author.name).toBe('Jon');
  expect(wrap(author).isManaged()).toBe(true);
  expect(author).not.toBe(book.author.unwrap());
});

test('collections of unmanaged entities cannot be loaded', async () => {
  const em = orm.em.fork();
  const author = em.map(Author, { id: 1, name: 'Jon' }, { managed: false });
  const message = 'Entity Author is not managed.';

  expect(author.books.isInitialized()).toBe(false);
  await expect(author.books.init()).rejects.toThrow(ValidationError);
  await expect(author.books.init()).rejects.toThrow(message);
  await expect(author.books.load()).rejects.toThrow(message);
  await expect(author.books.loadCount()).rejects.toThrow(message);
  expect(author.books.isInitialized()).toBe(false);
  expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);

  // the items can still be queried explicitly
  const books = await em.find(Book, { author: author.id });
  expect(books.map(b => b.id)).toEqual([10]);
  expect(author.books.isInitialized()).toBe(false);
});

describe('em.populate()', () => {
  const populateError = (entity: string) =>
    `Cannot populate unmanaged entity ${entity}. It was created without an EntityManager ` +
    '(e.g. via `em.map(..., { managed: false })`), load the relation with `em.find()`/`em.findOne()` or map the result as managed instead.';

  test('rejects unmanaged entities for M:1 relations without running queries', async () => {
    const [row] = await rawRows(Book);
    const em = orm.em.fork();
    const book = em.map(Book, row, { managed: false });

    await expect(em.populate(book, ['author'])).rejects.toThrow(ValidationError);
    await expect(em.populate(book, ['author'])).rejects.toThrow(populateError('Book(10)'));
    expect(book.author.isInitialized()).toBe(false);
    expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);
  });

  test('rejects unmanaged entities for 1:M relations', async () => {
    const em = orm.em.fork();
    const author = em.map(Author, { id: 1, name: 'Jon' }, { managed: false });

    await expect(em.populate(author, ['books'])).rejects.toThrow(populateError('Author(1)'));
    expect(author.books.isInitialized()).toBe(false);
    expect(em.getUnitOfWork().getIdentityMap().values()).toEqual([]);
  });

  test('rejects arrays mixing managed and unmanaged entities, loading nothing', async () => {
    const [row] = await rawRows(Book);
    const em = orm.em.fork();
    const managed = em.map(Book, { ...row });
    const unmanaged = em.map(Book, { ...row }, { managed: false });

    await expect(em.populate([managed, unmanaged], ['author'])).rejects.toThrow(populateError('Book(10)'));
    expect(managed.author.isInitialized()).toBe(false);
    expect(unmanaged.author.isInitialized()).toBe(false);
  });

  test('managed entities are populated as before', async () => {
    const [row] = await rawRows(Book);
    const em = orm.em.fork();
    const book = em.map(Book, row);

    await em.populate(book, ['author']);
    expect(book.author.isInitialized()).toBe(true);
    expect(book.author.unwrap().name).toBe('Jon');
  });

  test('relations of unmanaged entities can be loaded via em.findOne()', async () => {
    const [row] = await rawRows(Book);
    const em = orm.em.fork();
    const book = em.map(Book, row, { managed: false });
    const author = await em.findOneOrFail(Author, book.author.id, { populate: ['books'] });

    expect(wrap(author).isManaged()).toBe(true);
    expect(author.books.getItems().map(b => b.id)).toEqual([10]);
    expect(book.author.isInitialized()).toBe(false);
  });
});

test('default behaviour is unchanged', async () => {
  const [row] = await rawRows(Book);
  const em = orm.em.fork();
  const book = em.map(Book, row);

  expect(wrap(book).isManaged()).toBe(true);
  expect(wrap(book.author).isManaged()).toBe(true);
  expect(em.map(Book, row)).toBe(book);
  expect(em.map(Book, row, { managed: true })).toBe(book);
  expect(em.getUnitOfWork().getIdentityMap().values()).toHaveLength(4);
  await expect(book.author.load()).resolves.toMatchObject({ name: 'Jon' });

  // `ref()` created references keep loading via the global context
  await expect(ref(Author.class, 1).load()).resolves.toBeInstanceOf(Author.class);
});
