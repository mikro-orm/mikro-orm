import { Cascade, Collection, MikroORM, ValidationError, wrap, LoadStrategy, PrimaryKeyProp, Dictionary } from '@mikro-orm/core';
import { Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { AbstractSqlConnection, SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Entity()
class FooBar12 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class FooBaz12 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class FooParam12 {

  @ManyToOne(() => FooBar12, { primary: true })
  bar!: FooBar12;

  @ManyToOne(() => FooBaz12, { primary: true })
  baz!: FooBaz12;

  @Property()
  value: string;

  @Property({ version: true })
  version!: Date;

  [PrimaryKeyProp]?: ['bar', 'baz'];

  constructor(bar: FooBar12, baz: FooBaz12, value: string) {
    this.bar = bar;
    this.baz = baz;
    this.value = value;
  }

}

@Entity()
class Configuration12 {

  @PrimaryKey()
  property: string;

  @ManyToOne(() => Test12, { primary: true })
  test: any;

  @Property()
  value: string;

  constructor(test: any, property: string, value: string) {
    this.test = test;
    this.property = property;
    this.value = value;
  }

}

@Entity()
class Test12 {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @OneToMany(() => Configuration12, config => config.test)
  config = new Collection<Configuration12>(this);

  @Property({ version: true })
  version!: number;

  constructor(name: string) {
    this.name = name;
  }

  getConfiguration(): Record<string, string> {
    return this.config.getItems().reduce((c, v) => { c[v.property] = v.value; return c; }, {} as Dictionary);
  }

}

@Entity()
class Author12 {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToOne(() => Address12, 'author', { cascade: [Cascade.ALL] })
  address?: any;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity({ comment: 'This is address table' })
class Address12 {

  @OneToOne({ entity: () => Author12, primary: true, joinColumn: 'author_id', unique: 'address2_author_id_unique' })
  author: Author12;

  @Property({ comment: 'This is address property' })
  value: string;

  constructor(author: Author12, value: string) {
    this.author = author;
    this.value = value;
  }

}

@Entity()
class Car12 {

  @PrimaryKey({ length: 100 })
  name: string;

  @PrimaryKey()
  year: number;

  @Property()
  price: number;

  @ManyToMany(() => User12, 'cars')
  users = new Collection<User12>(this);

  [PrimaryKeyProp]?: ['name', 'year'];

  constructor(name: string, year: number, price: number) {
    this.name = name;
    this.year = year;
    this.price = price;
  }

}

@Entity()
class User12 {

  @PrimaryKey({ length: 100 })
  firstName: string;

  @PrimaryKey({ length: 100 })
  lastName: string;

  @Property({ nullable: true })
  foo?: number;

  @ManyToMany(() => Car12)
  cars = new Collection<Car12>(this);

  @ManyToMany(() => Sandwich12)
  sandwiches = new Collection<Sandwich12>(this);

  @OneToOne({ entity: () => Car12, nullable: true })
  favouriteCar?: Car12;

  [PrimaryKeyProp]?: ['firstName', 'lastName'];

  constructor(firstName: string, lastName: string) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

}

@Entity()
class Sandwich12 {

  @PrimaryKey()
  id!: number;

  @Property({ length: 255 })
  name: string;

  @Property()
  price: number;

  @ManyToMany(() => User12, u => u.sandwiches)
  users = new Collection<User12>(this);

  constructor(name: string, price: number) {
    this.name = name;
    this.price = price;
  }

}

@Entity()
class CarOwner12 {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToOne(() => Car12)
  car!: Car12;

  constructor(name: string) {
    this.name = name;
  }

}

describe('composite keys in sqlite', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: [Author12, Address12, FooBar12, FooBaz12, FooParam12, Configuration12, Test12, User12, Car12, CarOwner12, Sandwich12],
    });
    await orm.schema.refresh();
  });
  beforeEach(async () => {
    await orm.em.execute('pragma foreign_keys = off');
    await orm.em.nativeDelete(Author12, {});
    await orm.em.nativeDelete(Configuration12, {});
    await orm.em.nativeDelete(FooBar12, {});
    await orm.em.nativeDelete(FooBaz12, {});
    await orm.em.nativeDelete(FooParam12, {});
    await orm.em.nativeDelete(Test12, {});
    await orm.em.nativeDelete(Address12, {});
    await orm.em.nativeDelete(Car12, {});
    await orm.em.nativeDelete(CarOwner12, {});
    await orm.em.nativeDelete(User12, {});
    await orm.em.nativeDelete(Sandwich12, {});
    await orm.em.execute('pragma foreign_keys = on');
    orm.em.clear();
  });

  test('dynamic attributes', async () => {
    const test = new Test12('t');
    test.config.add(new Configuration12(test, 'foo', '1'));
    test.config.add(new Configuration12(test, 'bar', '2'));
    test.config.add(new Configuration12(test, 'baz', '3'));
    await orm.em.persist(test).flush();
    orm.em.clear();

    const t = await orm.em.findOneOrFail(Test12, test.id, { populate: ['config'] });
    expect(t.getConfiguration()).toEqual({
      foo: '1',
      bar: '2',
      baz: '3',
    });
  });

  test('working with composite entity', async () => {
    const bar = new FooBar12('bar');
    bar.id = 7;
    const baz = new FooBaz12('baz');
    baz.id = 3;
    const param = new FooParam12(bar, baz, 'val');
    await orm.em.persist(param).flush();
    orm.em.clear();

    // test populating a PK
    const p1 = await orm.em.findOneOrFail(FooParam12, [param.bar.id, param.baz.id] as const, { populate: ['bar'] });
    expect(wrap(p1).toJSON().bar).toMatchObject(wrap(p1.bar).toJSON());
    expect(wrap(p1).toJSON().baz).toBe(p1.baz.id);

    expect(p1.bar.id).toBe(bar.id);
    expect(p1.baz.id).toBe(baz.id);
    expect(p1.value).toBe('val');

    p1.value = 'val2';
    await orm.em.flush();
    orm.em.clear();

    const p2 = await orm.em.findOneOrFail(FooParam12, { bar: param.bar.id, baz: param.baz.id });
    expect(p2.bar.id).toBe(bar.id);
    expect(p2.baz.id).toBe(baz.id);
    expect(p2.value).toBe('val2');
    expect([...orm.em.getUnitOfWork().getIdentityMap().keys()].sort()).toEqual(['FooBar12-7', 'FooBaz12-3', 'FooParam12-7~~~3']);

    const p3 = await orm.em.findOneOrFail(FooParam12, { bar: param.bar.id, baz: param.baz.id });
    expect(p3).toBe(p2);

    await orm.em.remove(p3).flush();
    const p4 = await orm.em.findOne(FooParam12, { bar: param.bar.id, baz: param.baz.id });
    expect(p4).toBeNull();
  });

  test('simple derived entity', async () => {
    const author = new Author12('n');
    author.id = 5;
    author.address = new Address12(author, 'v1');
    await orm.em.persist(author).flush();
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(Author12, author.id, { populate: ['address'] });
    expect(a1.address!.value).toBe('v1');
    expect(a1.address!.author).toBe(a1);

    a1.address!.value = 'v2';
    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author12, author.id, { populate: ['address'] });
    expect(a2.address!.value).toBe('v2');
    expect(a2.address!.author).toBe(a2);

    const address = await orm.em.findOneOrFail(Address12, author.id as any);
    expect(address.author).toBe(a2);
    expect(address.author.address).toBe(address);

    await orm.em.remove(a2).flush();
    const a3 = await orm.em.findOne(Author12, author.id);
    expect(a3).toBeNull();
    const address2 = await orm.em.findOne(Address12, author.id as any);
    expect(address2).toBeNull();
  });

  test('composite entity in m:1 relationship', async () => {
    const car = new Car12('Audi A8', 2010, 200_000);
    const owner = new CarOwner12('John Doe');
    owner.car = car;
    await orm.em.persist(owner).flush();
    orm.em.clear();

    const o1 = await orm.em.findOneOrFail(CarOwner12, owner.id, { populate: ['car'], strategy: LoadStrategy.JOINED });
    expect(o1.car.price).toBe(200_000);
    expect(wrap(o1).toJSON()).toEqual({
      id: 1,
      name: 'John Doe',
      car: {
        name: 'Audi A8',
        price: 200_000,
        year: 2010,
      },
    });

    o1.car.price = 150_000;
    await orm.em.flush();
    orm.em.clear();

    const o2 = await orm.em.findOneOrFail(CarOwner12, owner.id);
    expect(wrap(o2).toJSON()).toEqual({
      id: 1,
      name: 'John Doe',
      car: { name: 'Audi A8', year: 2010 },
    });
    expect(wrap(o2.car).isInitialized()).toBe(false);
    expect(o2.car.price).toBeUndefined();
    await wrap(o2.car).init();
    expect(o2.car.price).toBe(150_000);

    const c1 = await orm.em.findOneOrFail(Car12, { name: car.name, year: car.year });
    expect(c1).toBe(o2.car);

    await orm.em.remove(o2).flush();
    const o3 = await orm.em.findOne(CarOwner12, owner.id);
    expect(o3).toBeNull();
    const c2 = await orm.em.findOneOrFail(Car12, car);
    expect(c2).toBe(o2.car);
    await orm.em.remove(c2).flush();
    const c3 = await orm.em.findOne(Car12, car);
    expect(c3).toBeNull();
    const user1 = new User12('f', 'l');
    const car11 = new Car12('n', 1, 1);
    user1.cars.add(car11);
    user1.favouriteCar = car11;
    user1.foo = 42;
    await orm.em.persist(user1).flush();
    orm.em.clear();

    const connMock = vi.spyOn(AbstractSqlConnection.prototype, 'execute');
    const cc = await orm.em.findOneOrFail(Car12, car11, { populate: ['users'], strategy: LoadStrategy.JOINED });
    expect(cc.users[0].foo).toBe(42);
    expect(connMock).toHaveBeenCalledTimes(1);
  });

  test('composite entity in m:1 relationship (multi update)', async () => {
    const car1 = new Car12('Audi A8', 2011, 100_000);
    const car2 = new Car12('Audi A8', 2012, 200_000);
    const car3 = new Car12('Audi A8', 2013, 300_000);
    const owner1 = new CarOwner12('John Doe 1');
    const owner2 = new CarOwner12('John Doe 2');
    owner1.car = car1;
    owner2.car = car2;
    await orm.em.persist([owner1, owner2]).flush();

    owner1.car = car2;
    owner2.car = car3;
    await orm.em.flush();
    orm.em.clear();

    const owners = await orm.em.find(CarOwner12, {}, { orderBy: { name: 'asc' } });
    expect(owners[0].car.year).toBe(2012);
    expect(owners[1].car.year).toBe(2013);
  });

  test('composite entity in m:n relationship, both entities are composite', async () => {
    const car1 = new Car12('Audi A8', 2011, 100_000);
    const car2 = new Car12('Audi A8', 2012, 150_000);
    const car3 = new Car12('Audi A8', 2013, 200_000);
    const user1 = new User12('John', 'Doe 1');
    const user2 = new User12('John', 'Doe 2');
    const user3 = new User12('John', 'Doe 3');
    user1.cars.add(car1, car3);
    user2.cars.add(car3);
    user2.cars.add(car2, car3);
    await orm.em.persist([user1, user2, user3]).flush();
    orm.em.clear();

    const u1 = await orm.em.findOneOrFail(User12, user1, { populate: ['cars'], strategy: LoadStrategy.JOINED });
    expect(u1.cars.isDirty()).toBe(false);
    expect(u1.cars.getItems()).toMatchObject([
      { name: 'Audi A8', price: 100_000, year: 2011 },
      { name: 'Audi A8', price: 200_000, year: 2013 },
    ]);
    expect(u1.cars.getIdentifiers()).toMatchObject([
      ['Audi A8', 2011],
      ['Audi A8', 2013],
    ]);
    expect(u1.cars[0].users.isDirty()).toBe(false);
    expect(wrap(u1).toJSON()).toEqual({
      firstName: 'John',
      lastName: 'Doe 1',
      favouriteCar: null,
      foo: null,
      cars: [
        { name: 'Audi A8', price: 100_000, year: 2011 },
        { name: 'Audi A8', price: 200_000, year: 2013 },
      ],
    });

    u1.foo = 321;
    u1.cars[0].price = 350_000;
    await orm.em.flush();
    orm.em.clear();

    const u2 = await orm.em.findOneOrFail(User12, u1, { populate: ['cars'] });
    expect(u2.cars[0].price).toBe(350_000);

    const c1 = await orm.em.findOneOrFail(Car12, { name: car1.name, year: car1.year });
    expect(c1).toBe(u2.cars[0]);

    await orm.em.remove(u2).flush();
    const o3 = await orm.em.findOne(User12, u1);
    expect(o3).toBeNull();
    const c2 = await orm.em.findOneOrFail(Car12, car1);
    await orm.em.remove(c2).flush();
    const c3 = await orm.em.findOne(Car12, car1);
    expect(c3).toBeNull();
  });

  test('removing composite entity in m:n relationship, one of entity is composite (GH #1961)', async () => {
    const sandwich1 = new Sandwich12('Fish Sandwich12', 100);
    const sandwich2 = new Sandwich12('Fried Egg Sandwich12', 200);
    const sandwich3 = new Sandwich12('Grilled Cheese Sandwich12', 300);
    const user1 = new User12('Henry', 'Doe 1');
    const user2 = new User12('Henry', 'Doe 2');
    const user3 = new User12('Henry', 'Doe 3');
    user1.sandwiches.add(sandwich1, sandwich3);
    user2.sandwiches.add(sandwich3);
    user2.sandwiches.add(sandwich2, sandwich3);
    await orm.em.persist([user1, user2, user3]).flush();

    const mock = mockLogger(orm);
    user2.sandwiches.removeAll();
    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('delete from `user12_sandwiches` where ((`sandwich12_id` = 2 and `user12_first_name` = \'Henry\' and `user12_last_name` = \'Doe 2\') or (`sandwich12_id` = 3 and `user12_first_name` = \'Henry\' and `user12_last_name` = \'Doe 2\'))');
    expect(mock.mock.calls[2][0]).toMatch('commit');
  });

  test('composite entity in m:n relationship, one of entity is composite', async () => {
    const sandwich1 = new Sandwich12('Fish Sandwich12', 100);
    const sandwich2 = new Sandwich12('Fried Egg Sandwich12', 200);
    const sandwich3 = new Sandwich12('Grilled Cheese Sandwich12', 300);
    const user1 = new User12('Henry', 'Doe 1');
    const user2 = new User12('Henry', 'Doe 2');
    const user3 = new User12('Henry', 'Doe 3');
    user1.sandwiches.add(sandwich1, sandwich3);
    user2.sandwiches.add(sandwich3);
    user2.sandwiches.add(sandwich2, sandwich3);
    await orm.em.persist([user1, user2, user3]).flush();
    orm.em.clear();

    const u1 = await orm.em.findOneOrFail(User12, user1, { populate: ['sandwiches'] });
    expect(u1.sandwiches.getItems()).toMatchObject([
      { name: 'Fish Sandwich12', price: 100 },
      { name: 'Grilled Cheese Sandwich12', price: 300 },
    ]);
    expect(wrap(u1).toJSON()).toMatchObject({
      firstName: 'Henry',
      lastName: 'Doe 1',
      foo: null,
      sandwiches: [
        { name: 'Fish Sandwich12', price: 100 },
        { name: 'Grilled Cheese Sandwich12', price: 300 },
      ],
    });

    u1.foo = 321;
    u1.sandwiches[0].price = 200;
    await orm.em.flush();
    orm.em.clear();

    const u2 = await orm.em.findOneOrFail(User12, u1, { populate: ['sandwiches'] });
    expect(u2.sandwiches[0].price).toBe(200);

    const c1 = await orm.em.findOneOrFail(Sandwich12, { id: sandwich1.id });
    expect(c1).toBe(u2.sandwiches[0]);

    await orm.em.remove(u2).flush();
    const o3 = await orm.em.findOne(User12, u1);
    expect(o3).toBeNull();
    const c2 = await orm.em.findOneOrFail(Sandwich12, sandwich1, { populate: ['users'] });
    await orm.em.remove(c2).flush();
    const c3 = await orm.em.findOne(Sandwich12, sandwich1);
    expect(c3).toBeNull();
  });

  test('composite key references', async () => {
    const ref = orm.em.getReference(Car12, ['n', 1], { wrapped: true });
    expect(ref.unwrap()).toBeInstanceOf(Car12);
    expect(wrap(ref, true).__primaryKeys).toEqual(['n', 1]);
    expect(() => orm.em.getReference(Car12, 1 as any)).toThrow('Composite key required for entity Car12.');
    expect(wrap(ref).toJSON()).toEqual({ name: 'n', year: 1 });
  });

  test('composite key in em.create()', async () => {
    await orm.em.insert(Car12, { name: 'n4', year: 2000, price: 456 });

    const c1 = new Car12('n1', 2000, 1);
    const c2 = { name: 'n3', year: 2000, price: 123 };
    const c3 = ['n4', 2000] as const; // composite PK

    // managed entity have an internal __em reference, so that is what we are testing here
    expect(wrap(c1, true).__em).toBeUndefined();
    const u1 = orm.em.create(User12, { firstName: 'f', lastName: 'l', cars: [c1, c2, c3] });
    expect(wrap(u1, true).__em).toBeUndefined();
    expect(wrap(u1.cars[0], true).__em).toBeUndefined();
    expect(wrap(u1.cars[1], true).__em).toBeUndefined();
    expect(wrap(u1.cars[2], true).__em).not.toBeUndefined(); // PK only, so will be merged automatically

    const mock = mockLogger(orm, ['query']);
    await orm.em.persist(u1).flush();
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `car12` (`name`, `year`, `price`) values (?, ?, ?), (?, ?, ?)'); // c1, c2
    expect(mock.mock.calls[2][0]).toMatch('insert into `user12` (`first_name`, `last_name`) values (?, ?)'); // u1
    expect(mock.mock.calls[3][0]).toMatch('insert into `user12_cars` (`car12_name`, `car12_year`, `user12_first_name`, `user12_last_name`) values (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)');
    expect(mock.mock.calls[4][0]).toMatch('commit');
  });

  test('batch updates with optimistic locking', async () => {
    const bar1 = new FooBar12('bar 1');
    bar1.id = 17;
    const baz1 = new FooBaz12('baz 1');
    baz1.id = 13;
    const param1 = new FooParam12(bar1, baz1, 'val 1');
    const bar2 = new FooBar12('bar 2');
    bar2.id = 27;
    const baz2 = new FooBaz12('baz 2');
    baz2.id = 23;
    const param2 = new FooParam12(bar2, baz2, 'val 1');
    const bar3 = new FooBar12('bar 3');
    bar3.id = 37;
    const baz3 = new FooBaz12('baz 3');
    baz3.id = 33;
    const param3 = new FooParam12(bar3, baz3, 'val 1');
    await orm.em.persist([param1, param2, param3]).flush();

    param1.value += ' changed!';
    param2.value += ' changed!';
    param3.value += ' changed!';
    await orm.em.flush();

    try {
      await orm.em.nativeUpdate(FooParam12, param2, { version: new Date('2020-01-01T00:00:00Z') }); // simulate concurrent update
      param1.value += ' changed!!';
      param2.value += ' changed!!';
      param3.value += ' changed!!';
      await orm.em.flush();
      expect(1).toBe('should be unreachable');
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).getEntity()).toBe(param2);
    }
  });

  test('loadCount for composite keys', async () => {
    const car = new Car12('Audi A8', 2010, 200_000);
    const user = new User12('John', 'Doe');
    user.cars.add(car);
    await orm.em.persist(user).flush();
    await expect(car.users.loadCount()).rejects.toBeTruthy();
    await expect(user.cars.loadCount()).rejects.toBeTruthy();
    // Fails due to a bug with knex: (see https://github.com/knex/knex/pull/2977)
    // await expect(car.users.loadCount()).resolves.toEqual(1);
    // await expect(user.cars.loadCount()).resolves.toEqual(1);
  });

  afterAll(async () => orm.close(true));

});

