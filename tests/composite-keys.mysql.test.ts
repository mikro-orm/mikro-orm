import { LoadStrategy, Logger, MikroORM, wrap } from '@mikro-orm/core';
import { AbstractSqlConnection, MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Configuration2, FooBar2, FooBaz2, FooParam2, Test2, Address2, Car2, CarOwner2, User2, Sandwich } from './entities-sql';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';

describe('composite keys in mysql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql());
  beforeEach(async () => wipeDatabaseMySql(orm.em));

  test('dynamic attributes', async () => {
    const test = Test2.create('t');
    test.config.add(new Configuration2(test, 'foo', '1'));
    test.config.add(new Configuration2(test, 'bar', '2'));
    test.config.add(new Configuration2(test, 'baz', '3'));
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const t = await orm.em.findOneOrFail(Test2, test.id, ['config']);
    expect(t.getConfiguration()).toEqual({
      foo: '1',
      bar: '2',
      baz: '3',
    });
  });

  test('working with composite entity', async () => {
    const bar = FooBar2.create('bar');
    bar.id = 7;
    const baz = new FooBaz2('baz');
    baz.id = 3;
    const param = new FooParam2(bar, baz, 'val');
    await orm.em.persistAndFlush(param);
    orm.em.clear();

    const p1 = await orm.em.findOneOrFail(FooParam2, [param.bar.id, param.baz.id]);
    expect(p1.bar.id).toBe(bar.id);
    expect(p1.baz.id).toBe(baz.id);
    expect(p1.value).toBe('val');

    p1.value = 'val2';
    await orm.em.flush();
    orm.em.clear();

    const p2 = await orm.em.findOneOrFail(FooParam2, { bar: param.bar.id, baz: param.baz.id });
    expect(p2.bar.id).toBe(bar.id);
    expect(p2.baz.id).toBe(baz.id);
    expect(p2.value).toBe('val2');
    expect(Object.keys(orm.em.getUnitOfWork().getIdentityMap()).sort()).toEqual(['FooBar2-7', 'FooBaz2-3', 'FooParam2-7~~~3']);

    const p3 = await orm.em.findOneOrFail(FooParam2, { bar: param.bar.id, baz: param.baz.id });
    expect(p3).toBe(p2);

    await orm.em.remove(p3).flush();
    const p4 = await orm.em.findOne(FooParam2, { bar: param.bar.id, baz: param.baz.id });
    expect(p4).toBeNull();
  });

  test('simple derived entity', async () => {
    const author = new Author2('n', 'e');
    author.id = 5;
    author.address = new Address2(author, 'v1');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const a1 = await orm.em.findOneOrFail(Author2, author.id, ['address']);
    expect(a1.address!.value).toBe('v1');
    expect(a1.address!.author).toBe(a1);

    a1.address!.value = 'v2';
    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, author.id, ['address']);
    expect(a2.address!.value).toBe('v2');
    expect(a2.address!.author).toBe(a2);

    const address = await orm.em.findOneOrFail(Address2, author.id as any);
    expect(address.author).toBe(a2);
    expect(address.author.address).toBe(address);

    await orm.em.remove(a2).flush();
    const a3 = await orm.em.findOne(Author2, author.id);
    expect(a3).toBeNull();
    const address2 = await orm.em.findOne(Address2, author.id as any);
    expect(address2).toBeNull();
  });

  test('composite entity in m:1 relationship', async () => {
    const car = new Car2('Audi A8', 2010, 200_000);
    const owner = new CarOwner2('John Doe');
    owner.car = car;
    await orm.em.persistAndFlush(owner);
    orm.em.clear();

    const o1 = await orm.em.findOneOrFail(CarOwner2, owner.id, { populate: { car: LoadStrategy.JOINED } });
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

    const o2 = await orm.em.findOneOrFail(CarOwner2, owner.id);
    expect(wrap(o2).toJSON()).toEqual({
      id: 1,
      name: 'John Doe',
      car: { name: 'Audi A8', year: 2010 },
    });
    expect(wrap(o2.car).isInitialized()).toBe(false);
    expect(o2.car.price).toBeUndefined();
    await wrap(o2.car).init();
    expect(o2.car.price).toBe(150_000);

    const c1 = await orm.em.findOneOrFail(Car2, { name: car.name, year: car.year });
    expect(c1).toBe(o2.car);

    await orm.em.remove(o2).flush();
    const o3 = await orm.em.findOne(CarOwner2, owner.id);
    expect(o3).toBeNull();
    const c2 = await orm.em.findOneOrFail(Car2, car);
    expect(c2).toBe(o2.car);
    await orm.em.remove(c2).flush();
    const c3 = await orm.em.findOne(Car2, car);
    expect(c3).toBeNull();
    const user1 = new User2('f', 'l');
    const car11 = new Car2('n', 1, 1);
    user1.cars.add(car11);
    user1.favouriteCar = car11;
    user1.foo = 42;
    await orm.em.persistAndFlush(user1);
    orm.em.clear();

    const connMock = jest.spyOn(AbstractSqlConnection.prototype, 'execute');
    const cc = await orm.em.findOneOrFail(Car2, car11, { populate: { users: LoadStrategy.JOINED } });
    expect(cc.users[0].foo).toBe(42);
    expect(connMock).toBeCalledTimes(1);
  });

  test('composite entity in m:n relationship, both entities are composite', async () => {
    const car1 = new Car2('Audi A8', 2011, 100_000);
    const car2 = new Car2('Audi A8', 2012, 150_000);
    const car3 = new Car2('Audi A8', 2013, 200_000);
    const user1 = new User2('John', 'Doe 1');
    const user2 = new User2('John', 'Doe 2');
    const user3 = new User2('John', 'Doe 3');
    user1.cars.add(car1, car3);
    user2.cars.add(car3);
    user2.cars.add(car2, car3);
    await orm.em.persistAndFlush([user1, user2, user3]);
    orm.em.clear();

    const u1 = await orm.em.findOneOrFail(User2, user1, { populate: { cars: LoadStrategy.JOINED } });
    expect(u1.cars.getItems()).toMatchObject([
      { name: 'Audi A8', price: 100_000, year: 2011 },
      { name: 'Audi A8', price: 200_000, year: 2013 },
    ]);
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

    const u2 = await orm.em.findOneOrFail(User2, u1, ['cars']);
    expect(u2.cars[0].price).toBe(350_000);

    const c1 = await orm.em.findOneOrFail(Car2, { name: car1.name, year: car1.year });
    expect(c1).toBe(u2.cars[0]);

    await orm.em.remove(u2).flush();
    const o3 = await orm.em.findOne(User2, u1);
    expect(o3).toBeNull();
    const c2 = await orm.em.findOneOrFail(Car2, car1);
    expect(c2).toBe(u2.cars[0]);
    await orm.em.remove(c2).flush();
    const c3 = await orm.em.findOne(Car2, car1);
    expect(c3).toBeNull();
  });

  test('composite entity in m:n relationship, one of entity is composite', async () => {
    const sandwich1 = new Sandwich('Fish Sandwich', 100);
    const sandwich2 = new Sandwich('Fried Egg Sandwich', 200);
    const sandwich3 = new Sandwich('Grilled Cheese Sandwich', 300);
    const user1 = new User2('Henry', 'Doe 1');
    const user2 = new User2('Henry', 'Doe 2');
    const user3 = new User2('Henry', 'Doe 3');
    user1.sandwiches.add(sandwich1, sandwich3);
    user2.sandwiches.add(sandwich3);
    user2.sandwiches.add(sandwich2, sandwich3);
    await orm.em.persistAndFlush([user1, user2, user3]);
    orm.em.clear();

    const u1 = await orm.em.findOneOrFail(User2, user1, ['sandwiches']);
    expect(u1.sandwiches.getItems()).toMatchObject([
      { name: 'Fish Sandwich', price: 100 },
      { name: 'Grilled Cheese Sandwich', price: 300 },
    ]);
    expect(wrap(u1).toJSON()).toMatchObject({
      firstName: 'Henry',
      lastName: 'Doe 1',
      foo: null,
      sandwiches: [
        { name: 'Fish Sandwich', price: 100 },
        { name: 'Grilled Cheese Sandwich', price: 300 },
      ],
    });

    u1.foo = 321;
    u1.sandwiches[0].price = 200;
    await orm.em.flush();
    orm.em.clear();

    const u2 = await orm.em.findOneOrFail(User2, u1, ['sandwiches']);
    expect(u2.sandwiches[0].price).toBe(200);

    const c1 = await orm.em.findOneOrFail(Sandwich, { id: sandwich1.id });
    expect(c1).toBe(u2.sandwiches[0]);

    await orm.em.remove(u2).flush();
    const o3 = await orm.em.findOne(User2, u1);
    expect(o3).toBeNull();
    const c2 = await orm.em.findOneOrFail(Sandwich, sandwich1, ['users']);
    expect(c2).toBe(u2.sandwiches[0]);
    await orm.em.remove(c2).flush();
    const c3 = await orm.em.findOne(Sandwich, sandwich1);
    expect(c3).toBeNull();
  });

  test('composite key references', async () => {
    const ref = orm.em.getReference(Car2, ['n', 1], true);
    expect(ref.unwrap()).toBeInstanceOf(Car2);
    expect(wrap(ref, true).__primaryKeys).toEqual(['n', 1]);
    expect(() => orm.em.getReference(Car2, 1 as any)).toThrowError('Composite key required for entity Car2.');
    expect(wrap(ref).toJSON()).toEqual({ name: 'n', year: 1 });
  });

  test('composite key in em.create()', async () => {
    await orm.em.nativeInsert(Car2, { name: 'n4', year: 2000, price: 456 });

    const factory = orm.em.getEntityFactory();
    const c1 = new Car2('n1', 2000, 1);
    const c2 = { name: 'n3', year: 2000, price: 123 };
    const c3 = ['n4', 2000]; // composite PK

    // managed entity have an internal __em reference, so that is what we are testing here
    expect(wrap(c1, true).__em).toBeUndefined();
    const u1 = factory.create(User2, { firstName: 'f', lastName: 'l', cars: [c1, c2, c3] });
    expect(wrap(u1, true).__em).toBeUndefined();
    expect(wrap(u1.cars[0], true).__em).toBeUndefined();
    expect(wrap(u1.cars[1], true).__em).toBeUndefined();
    expect(wrap(u1.cars[2], true).__em).not.toBeUndefined(); // PK only, so will be merged automatically

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });
    await orm.em.persistAndFlush(u1);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `car2` (`name`, `price`, `year`) values (?, ?, ?)'); // c1
    expect(mock.mock.calls[2][0]).toMatch('insert into `car2` (`name`, `price`, `year`) values (?, ?, ?)'); // c2
    expect(mock.mock.calls[3][0]).toMatch('insert into `user2` (`first_name`, `last_name`) values (?, ?)'); // u1
    expect(mock.mock.calls[4][0]).toMatch('insert into `user2_cars` (`car2_name`, `car2_year`, `user2_first_name`, `user2_last_name`) values (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)');
    expect(mock.mock.calls[5][0]).toMatch('commit');
  });

  afterAll(async () => orm.close(true));

});
