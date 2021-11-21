import { MikroORM, Entity, PrimaryKey, Property, OptimisticLockError } from '@mikro-orm/core';
import { mockLogger } from '../../helpers';

@Entity()
export class ConcurrencyCheckUser {

  @PrimaryKey()
  _id!: string;

  @Property({ length: 100, concurrencyCheck: true })
  firstName: string;

  @Property({ length: 100, concurrencyCheck: true })
  lastName: string;

  @Property({ concurrencyCheck: true })
  age: number;

  @Property({ nullable: true })
  other?: string;

  constructor(_id: string, firstName: string, lastName: string, age: number) {
    this._id = _id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
  }

}

describe('optimistic locking - concurrency check (mongo)', () => {

  let orm: MikroORM;
  let mock: jest.Mock;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [ConcurrencyCheckUser],
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro_orm_test_concurrency_check?replicaSet=rs',
      type: 'mongo',
    });
    mock = mockLogger(orm, ['query', 'query-params']);
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(ConcurrencyCheckUser, {});
    orm.em.clear();
    mock.mockReset();
  });

  afterAll(async () => orm.close(true));

  test('should compare original to database value on entity update', async () => {
    const test = new ConcurrencyCheckUser('1', 'Jakub', 'Smith', 20);
    test.other = 'dsa';

    await orm.em.persistAndFlush(test);
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('concurrency-check-user').insertOne({ _id: '1', firstName: 'Jakub', lastName: 'Smith', age: 20, other: 'dsa' }, { session: undefined });`);

    mock.mockReset();

    test.age = 30;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('concurrency-check-user').updateMany({ _id: '1', firstName: 'Jakub', lastName: 'Smith', age: 20 }, { '$set': { age: 30 } }, { session: undefined });`);

    mock.mockReset();

    test.age = 40;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('concurrency-check-user').updateMany({ _id: '1', firstName: 'Jakub', lastName: 'Smith', age: 30 }, { '$set': { age: 40 } }, { session: undefined });`);

    mock.mockReset();

    test.other = 'asd';
    await expect(orm.em.flush()).rejects.toThrowError(`The optimistic lock on entity ConcurrencyCheckUser failed`);

    mock.mockReset();

    test.age = 41;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('concurrency-check-user').updateMany({ _id: '1', firstName: 'Jakub', lastName: 'Smith', age: 40 }, { '$set': { age: 41, other: 'asd' } }, { session: undefined });`);
  });

  test('throws when someone changed the state in the meantime', async () => {
    const test = new ConcurrencyCheckUser('1', 'Jakub', 'Smith', 20);
    test.other = 'dsa';
    await orm.em.fork().persistAndFlush(test);

    const test2 = await orm.em.findOneOrFail(ConcurrencyCheckUser, test);
    await orm.em.nativeUpdate(ConcurrencyCheckUser, test, { age: 123 }); // simulate concurrent update
    test2!.age = 50;
    test2!.other = 'WHATT???';

    try {
      await orm.em.flush();
      expect(1).toBe('should be unreachable');
    } catch (e: any) {
      expect(e).toBeInstanceOf(OptimisticLockError);
      expect(e.message).toBe(`The optimistic lock on entity ConcurrencyCheckUser failed`);
      expect((e as OptimisticLockError).getEntity()).toBe(test2);
    }
  });

  test('should compare original to database value on entity update (batch update)', async () => {
    const test1 = new ConcurrencyCheckUser('1', 'Jakub', 'Smith', 20);
    test1.other = 'dsa';
    const test2 = new ConcurrencyCheckUser('2', 'John', 'Smith', 25);
    test2.other = 'lol';

    await orm.em.persistAndFlush([test1, test2]);
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('concurrency-check-user').insertMany([ { _id: '1', firstName: 'Jakub', lastName: 'Smith', age: 20, other: 'dsa' }, { _id: '2', firstName: 'John', lastName: 'Smith', age: 25, other: 'lol' } ], { session: undefined });`);

    mock.mockReset();

    test1.age = 30;
    test2.age = 35;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('concurrency-check-user').find({ '$or': [ { _id: '1', firstName: 'Jakub', lastName: 'Smith', age: 20 }, { _id: '2', firstName: 'John', lastName: 'Smith', age: 25 } ] }, { session: undefined, projection: { _id: 1, firstName: 1, lastName: 1, age: 1 } }).toArray();`);
    expect(mock.mock.calls[1][0]).toMatch(`bulk = db.getCollection('concurrency-check-user').initializeUnorderedBulkOp({ session: undefined });bulk.find({ _id: '1' }).update({ '$set': { age: 30 } });bulk.find({ _id: '2' }).update({ '$set': { age: 35 } });bulk.execute()`);

    mock.mockReset();

    test1.age = 40;
    test2.age = 45;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('concurrency-check-user').find({ '$or': [ { _id: '1', firstName: 'Jakub', lastName: 'Smith', age: 30 }, { _id: '2', firstName: 'John', lastName: 'Smith', age: 35 } ] }, { session: undefined, projection: { _id: 1, firstName: 1, lastName: 1, age: 1 } }).toArray();`);
    expect(mock.mock.calls[1][0]).toMatch(`bulk = db.getCollection('concurrency-check-user').initializeUnorderedBulkOp({ session: undefined });bulk.find({ _id: '1' }).update({ '$set': { age: 40 } });bulk.find({ _id: '2' }).update({ '$set': { age: 45 } });bulk.execute()`);

    mock.mockReset();

    test1.other = 'asd';
    test2.other = 'lololol';
    await expect(orm.em.flush()).rejects.toThrowError(`The optimistic lock on entity ConcurrencyCheckUser failed`);

    mock.mockReset();

    test1.age = 41;
    test2.age = 46;
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('concurrency-check-user').find({ '$or': [ { _id: '1', firstName: 'Jakub', lastName: 'Smith', age: 40 }, { _id: '2', firstName: 'John', lastName: 'Smith', age: 45 } ] }, { session: undefined, projection: { _id: 1, firstName: 1, lastName: 1, age: 1 } }).toArray();`);
    expect(mock.mock.calls[1][0]).toMatch(`bulk = db.getCollection('concurrency-check-user').initializeUnorderedBulkOp({ session: undefined });bulk.find({ _id: '1' }).update({ '$set': { age: 41, other: 'asd' } });bulk.find({ _id: '2' }).update({ '$set': { age: 46, other: 'lololol' } });bulk.execute()`);
  });

  test('throws when someone changed the state in the meantime (batch update)', async () => {
    const test1 = new ConcurrencyCheckUser('1', 'Jakub', 'Smith', 20);
    test1.other = 'dsa';
    const test2 = new ConcurrencyCheckUser('2', 'John', 'Smith', 25);
    test2.other = 'lol';

    await orm.em.fork().persistAndFlush([test1, test2]);

    const tests = await orm.em.find(ConcurrencyCheckUser, {}, { orderBy: { age: 1 } });
    await orm.em.nativeUpdate(ConcurrencyCheckUser, tests[0], { age: 123 }); // simulate concurrent update
    await orm.em.nativeUpdate(ConcurrencyCheckUser, tests[1], { age: 124 }); // simulate concurrent update
    tests[0].age = 50;
    tests[0].other = 'WHATT???';
    tests[1].age = 51;
    tests[1].other = 'WHATT???';

    try {
      await orm.em.flush();
      expect(1).toBe('should be unreachable');
    } catch (e: any) {
      expect(e).toBeInstanceOf(OptimisticLockError);
      expect(e.message).toBe(`The optimistic lock on entity ConcurrencyCheckUser failed`);
      expect((e as OptimisticLockError).getEntity()).toBe(tests[0]);
    }
  });

});
