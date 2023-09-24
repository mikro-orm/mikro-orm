import type { MikroORM, ValidationError } from '@mikro-orm/core';
import { LoadStrategy, wrap } from '@mikro-orm/core';
import { AbstractSqlConnection, MySqlDriver } from '@mikro-orm/mysql';
import { Author2, Configuration2, FooBar2, FooBaz2, FooParam2, Test2, Address2, Car2, CarOwner2, User2, Sandwich } from '../../entities-sql';
import { initORMMySql, mockLogger } from '../../bootstrap';

describe('composite keys in mysql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('dynamic attributes', async () => {
    const test = Test2.create('t');
    test.config.add(new Configuration2(test, 'foo', '1'));
    test.config.add(new Configuration2(test, 'bar', '2'));
    test.config.add(new Configuration2(test, 'baz', '3'));
    await orm.em.persistAndFlush(test);
    orm.em.clear();

    const t = await orm.em.findOneOrFail(Test2, test.id, { populate: ['config'] });
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

    // test populating a PK
    const p1 = await orm.em.findOneOrFail(FooParam2, [param.bar.id, param.baz.id], { populate: ['bar'] });
    expect(wrap(p1).toJSON().bar).toMatchObject(wrap(p1.bar).toJSON());
    expect(wrap(p1).toJSON().baz).toBe(p1.baz.id);

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
    expect(orm.em.getUnitOfWork().getIdentityMap().keys().sort()).toEqual(['FooBar2-7', 'FooBaz2-3', 'FooParam2-7~~~3']);

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

    const a1 = await orm.em.findOneOrFail(Author2, author.id, { populate: ['address'] });
    expect(a1.address!.value).toBe('v1');
    expect(a1.address!.author).toBe(a1);

    a1.address!.value = 'v2';
    await orm.em.flush();
    orm.em.clear();

    const a2 = await orm.em.findOneOrFail(Author2, author.id, { populate: ['address'] });
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

    const o1 = await orm.em.findOneOrFail(CarOwner2, owner.id, { populate: ['car'], strategy: LoadStrategy.JOINED });
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
    const cc = await orm.em.findOneOrFail(Car2, car11, { populate: ['users'], strategy: LoadStrategy.JOINED });
    expect(cc.users[0].foo).toBe(42);
    expect(connMock).toBeCalledTimes(1);
  });

  test('composite entity in m:1 relationship (multi update)', async () => {
    const car1 = new Car2('Audi A8', 2011, 100_000);
    const car2 = new Car2('Audi A8', 2012, 200_000);
    const car3 = new Car2('Audi A8', 2013, 300_000);
    const owner1 = new CarOwner2('John Doe 1');
    const owner2 = new CarOwner2('John Doe 2');
    owner1.car = car1;
    owner2.car = car2;
    await orm.em.persistAndFlush([owner1, owner2]);

    owner1.car = car2;
    owner2.car = car3;
    await orm.em.flush();
    orm.em.clear();

    const owners = await orm.em.find(CarOwner2, {}, { orderBy: { name: 'asc' } });
    expect(owners[0].car.year).toBe(2012);
    expect(owners[1].car.year).toBe(2013);
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

    const u1 = await orm.em.findOneOrFail(User2, user1, { populate: ['cars'], strategy: LoadStrategy.JOINED });
    expect(u1.cars.isDirty()).toBe(false);
    expect(u1.cars.getItems()).toMatchObject([
      { name: 'Audi A8', price: 100_000, year: 2011 },
      { name: 'Audi A8', price: 200_000, year: 2013 },
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

    const u2 = await orm.em.findOneOrFail(User2, u1, { populate: ['cars'] });
    expect(u2.cars[0].price).toBe(350_000);

    const c1 = await orm.em.findOneOrFail(Car2, { name: car1.name, year: car1.year });
    expect(c1).toBe(u2.cars[0]);

    await orm.em.remove(u2).flush();
    const o3 = await orm.em.findOne(User2, u1);
    expect(o3).toBeNull();
    const c2 = await orm.em.findOneOrFail(Car2, car1);
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

    const u1 = await orm.em.findOneOrFail(User2, user1, { populate: ['sandwiches'] });
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

    const u2 = await orm.em.findOneOrFail(User2, u1, { populate: ['sandwiches'] });
    expect(u2.sandwiches[0].price).toBe(200);

    const c1 = await orm.em.findOneOrFail(Sandwich, { id: sandwich1.id });
    expect(c1).toBe(u2.sandwiches[0]);

    await orm.em.remove(u2).flush();
    const o3 = await orm.em.findOne(User2, u1);
    expect(o3).toBeNull();
    const c2 = await orm.em.findOneOrFail(Sandwich, sandwich1, { populate: ['users'] });
    await orm.em.remove(c2).flush();
    const c3 = await orm.em.findOne(Sandwich, sandwich1);
    expect(c3).toBeNull();
  });

  test('composite key references', async () => {
    const ref = orm.em.getReference(Car2, ['n', 1], { wrapped: true });
    expect(ref.unwrap()).toBeInstanceOf(Car2);
    expect(wrap(ref, true).__primaryKeys).toEqual(['n', 1]);
    expect(() => orm.em.getReference(Car2, 1 as any)).toThrowError('Composite key required for entity Car2.');
    expect(wrap(ref).toJSON()).toEqual({ name: 'n', year: 1 });
  });

  test('composite key in em.create()', async () => {
    await orm.em.insert(Car2, { name: 'n4', year: 2000, price: 456 });

    const c1 = new Car2('n1', 2000, 1);
    const c2 = { name: 'n3', year: 2000, price: 123 };
    const c3 = ['n4', 2000] as const; // composite PK

    // managed entity have an internal __em reference, so that is what we are testing here
    expect(wrap(c1, true).__em).toBeUndefined();
    const u1 = orm.em.create(User2, { firstName: 'f', lastName: 'l', cars: [c1, c2, c3] });
    expect(wrap(u1, true).__em).toBeUndefined();
    expect(wrap(u1.cars[0], true).__em).toBeUndefined();
    expect(wrap(u1.cars[1], true).__em).toBeUndefined();
    expect(wrap(u1.cars[2], true).__em).not.toBeUndefined(); // PK only, so will be merged automatically

    const mock = mockLogger(orm, ['query']);
    await orm.em.persistAndFlush(u1);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `car2` (`name`, `year`, `price`) values (?, ?, ?), (?, ?, ?)'); // c1, c2
    expect(mock.mock.calls[2][0]).toMatch('insert into `user2` (`first_name`, `last_name`) values (?, ?)'); // u1
    expect(mock.mock.calls[3][0]).toMatch('insert into `user2_cars` (`user2_first_name`, `user2_last_name`, `car2_name`, `car2_year`) values (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)');
    expect(mock.mock.calls[4][0]).toMatch('commit');
  });

  test('batch updates with optimistic locking', async () => {
    const bar1 = FooBar2.create('bar 1');
    bar1.id = 17;
    const baz1 = new FooBaz2('baz 1');
    baz1.id = 13;
    const param1 = new FooParam2(bar1, baz1, 'val 1');
    const bar2 = FooBar2.create('bar 2');
    bar2.id = 27;
    const baz2 = new FooBaz2('baz 2');
    baz2.id = 23;
    const param2 = new FooParam2(bar2, baz2, 'val 1');
    const bar3 = FooBar2.create('bar 3');
    bar3.id = 37;
    const baz3 = new FooBaz2('baz 3');
    baz3.id = 33;
    const param3 = new FooParam2(bar3, baz3, 'val 1');
    await orm.em.persistAndFlush([param1, param2, param3]);

    param1.value += ' changed!';
    param2.value += ' changed!';
    param3.value += ' changed!';
    await orm.em.flush();

    try {
      await orm.em.nativeUpdate(FooParam2, param2, { version: new Date('2020-01-01T00:00:00Z') }); // simulate concurrent update
      param1.value += ' changed!!';
      param2.value += ' changed!!';
      param3.value += ' changed!!';
      await orm.em.flush();
      expect(1).toBe('should be unreachable');
    } catch (e) {
      expect((e as ValidationError).getEntity()).toBe(param2);
    }
  });

  test('loadCount for composite keys', async () => {
    const car = new Car2('Audi A8', 2010, 200_000);
    const user = new User2('John', 'Doe');
    user.cars.add(car);
    await orm.em.persistAndFlush(user);
    await expect(car.users.loadCount()).resolves.toEqual(1);
    await expect(user.cars.loadCount()).resolves.toEqual(1);
  });

  test('changing PK', async () => {
    const car = new Car2('Audi A8', 2010, 200_000);
    await orm.em.persistAndFlush(car);
    car.year = 2015;

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock).toBeCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch("update `car2` set `year` = 2015 where `name` = 'Audi A8' and `year` = 2010");

    const c = await orm.em.fork().findOne(Car2, car);
    expect(c).toBeDefined();
    expect(c!.year).toBe(2015);
  });

  test('changing PK (batch)', async () => {
    const cars = [
      new Car2('Audi A8 a', 2011, 200_000),
      new Car2('Audi A8 b', 2012, 200_000),
    ];
    await orm.em.persistAndFlush(cars);
    cars[0].year = 2015;
    cars[1].year = 2016;

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock).toBeCalledTimes(3);
    expect(mock.mock.calls[1][0]).toMatch("update `car2` set `year` = case when (`name` = 'Audi A8 a' and `year` = 2011) then 2015 when (`name` = 'Audi A8 b' and `year` = 2012) then 2016 else `year` end where (`name`, `year`) in (('Audi A8 a', 2011), ('Audi A8 b', 2012))");

    const c1 = await orm.em.fork().findOne(Car2, cars[0]);
    expect(c1).toBeDefined();
    expect(c1!.year).toBe(2015);

    const c2 = await orm.em.fork().findOne(Car2, cars[1]);
    expect(c2).toBeDefined();
    expect(c2!.year).toBe(2016);

    await orm.em.flush();
    expect(mock).toBeCalledTimes(5);
  });

  test('qb.leftJoinAndSelect() with FK as PK', async () => {
    const author = new Author2('n', 'e');
    author.id = 5;
    author.address = new Address2(author, 'v1');
    await orm.em.persistAndFlush(author);
    orm.em.clear();

    const addr1 = await orm.em.createQueryBuilder(Address2, 'addr')
      .select('addr.*')
      .leftJoinAndSelect('addr.author', 'a')
      .where({ 'a.id': author.id })
      .getSingleResult();
    expect(addr1!.value).toBe('v1');
    expect(addr1!.author.id).toBe(5);
    expect(addr1!.author.name).toBe('n');
    expect(addr1!.author.email).toBe('e');
    orm.em.clear();

    const a1 = await orm.em.createQueryBuilder(Author2, 'a')
      .select('a.*')
      .leftJoinAndSelect('a.address', 'addr')
      .where({ id: author.id })
      .getSingleResult();
    expect(a1!.id).toBe(5);
    expect(a1!.name).toBe('n');
    expect(a1!.email).toBe('e');
    expect(a1!.address!.value).toBe('v1');
    expect(a1!.address!.author).toBe(a1);
  });

});
