import {
  Collection,
  DecimalType,
  defineConfig,
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class Money {

  @Property({
    type: new DecimalType('number'),
    runtimeType: 'number',
    scale: 2,
  })
  amount: number;

  @Property({ length: 3 })
  currencyCode: string;

  constructor(amount: number, currencyCode: string) {
    this.amount = amount;
    this.currencyCode = currencyCode;
  }

}

@Entity({ tableName: 'test_user' })
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  email: string;

  @Property({ type: 'decimal', runtimeType: 'number', scale: 2 })
  decimal: number | null = null;

  @OneToMany<Book, User>({
    entity: () => Book,
    mappedBy: book => book.user,
    orderBy: {
      id: 'ASC',
    },
  })
  books = new Collection<Book, this>(this);

  constructor(
    id: number,
    name: string,
    email: string,
    decimal: number | null = null,
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.decimal = decimal;
  }

}

@Entity({ tableName: 'test_books' })
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({
    type: new DecimalType('number'),
    runtimeType: 'number',
    scale: 2,
  })
  decimalAmount: number;

  @Embedded(() => Money)
  price: Money;

  @ManyToOne<Book, User>({
    entity: () => User,
    inversedBy: user => user.books,
  })
  user: User;

  constructor(
    id: number,
    name: string,
    decimalAmount: number,
    price: Money,
    user: User,
  ) {
    this.id = id;
    this.name = name;
    this.decimalAmount = decimalAmount;
    this.price = price;
    this.user = user;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init(
    defineConfig({
      dbName: 'decimal-type-diffing',
      entities: [User, Book],
      forceEntityConstructor: true,
    }),
  );
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('should not update book entity when findOne a user WITHOUT books', async () => {
  const user = orm.em.create(User, {
    id: 1,
    name: 'Foo',
    email: 'foo',
    decimal: 2.22,
  });
  user.books.add(new Book(1, 'book-1', 11.45, new Money(10.54, 'USD'), user));
  orm.em.clear();

  await orm.em.findOne(User, 1);
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('should not update book entity when findOne a user WITH books', async () => {
  const user = orm.em.create(User, {
    id: 2,
    name: 'Foo',
    email: 'foo',
    decimal: 2.22,
  });
  user.books.add(new Book(2, 'book-2', 11.45, new Money(10.54, 'USD'), user));
  await orm.em.flush();
  orm.em.clear();

  await orm.em.findOne(User, 2, {
    populate: ['books'],
  });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('should not update book entities when find them after creating using constructors', async () => {
  const user = new User(3, 'Foo', 'foo', 2.22);
  const book = new Book(3, 'book-3', 11.45, new Money(10.54, 'USD'), user);
  user.books.add(book);
  orm.em.persist(user);
  await orm.em.flush();
  orm.em.clear();

  await orm.em.findOne(User, 3, {
    populate: ['books'],
  });

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('should not update book entity when findOne Book when decimals are zeros', async () => {
  const user = orm.em.create(User, {
    id: 5,
    name: 'Foo',
    email: 'foo',
    decimal: 2,
  });
  user.books.add(new Book(5, 'book-1', 11.0, new Money(10.0, 'USD'), user));
  await orm.em.flush();
  orm.em.clear();

  await orm.em.findOne(Book, 5);
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('should not update book entity when findOne Book when decimals are missing', async () => {
  const user = orm.em.create(User, {
    id: 6,
    name: 'Foo',
    email: 'foo',
    decimal: 2,
  });
  user.books.add(new Book(6, 'book-1', 11, new Money(10, 'USD'), user));
  await orm.em.flush();
  orm.em.clear();

  await orm.em.findOne(Book, 6);
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});

test('should not update book entity when findOne Book when decimals have specific decimals making JS round badly', async () => {
  const user = orm.em.create(User, {
    id: 7,
    name: 'Foo',
    email: 'foo',
    decimal: 2,
  });
  user.books.add(new Book(7, 'book-1', 185.385, new Money(185.385, 'USD'), user));
  await orm.em.flush();
  orm.em.clear();

  const b = await orm.em.findOneOrFail(Book, 7);
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();

  expect(b.price.amount).toBe(185.39); // Database rounds "185.385" to "185.39"
  b.price = new Money(185.385, 'USD'); // I store again the initial price value "185.385"
  mock.mockReset();
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
