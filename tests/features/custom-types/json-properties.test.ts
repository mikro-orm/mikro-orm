import { MikroORM, Entity, PrimaryKey, Property, SimpleLogger, wrap } from '@mikro-orm/core';
import { mockLogger } from '../../helpers';

@Entity()
export class User {

  static id = 1;

  @PrimaryKey({ name: '_id' })
  id: number = User.id++;

  @Property({ columnType: 'json' })
  value: any;

}

const options = {
  'sqlite': { dbName: ':memory:' },
  'better-sqlite': { dbName: ':memory:' },
  'mysql': { dbName: 'mikro_orm_json_props', port: 3308 },
  'mariadb': { dbName: 'mikro_orm_json_props', port: 3309 },
  'postgresql': { dbName: 'mikro_orm_json_props' },
  'mongo': { dbName: 'mikro_orm_json_props' },
};

describe.each(Object.keys(options))('JSON properties [%s]',  type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      type,
      loggerFactory: options => new SimpleLogger(options),
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    User.id = 1;
  });

  afterAll(() => orm.close());

  test('em.insert()', async () => {
    await orm.em.insert(User, { value: 'test' });
    const res = await orm.em.findOneOrFail(User, { value: 'test' });
    expect(res.value).toBe('test');

    await orm.em.insert(User, { value: true });
    const res2 = await orm.em.findOneOrFail(User, { value: true });
    expect(res2.value).toBe(true);

    // this should work in v6, once the `raw()` helper refactor will be merged
    // await orm.em.insert(User, { value: [1, 2, 3] });
    // const res3 = await orm.em.findOneOrFail(User, { value: { $eq: [1, 2, 3] } });
    // expect(res3.value).toEqual([1, 2, 3]);
  });

  test('em.insert() with object value', async () => {
    await orm.em.insert(User, { value: { foo: 'test' } });
    const res = await orm.em.findOneOrFail(User, { value: { foo: 'test' } });
    expect(res.value).toEqual({ foo: 'test' });
  });

  test('em.insertMany()', async () => {
    await orm.em.insertMany(User, [{ value: 'test' }, { value: 'test' }]);
    const res = await orm.em.findOneOrFail(User, { value: 'test' });
    expect(res.value).toBe('test');
  });

  test('em.flush()', async () => {
    orm.em.create(User, { value: 'test' });
    await orm.em.flush();
    orm.em.clear();

    const res = await orm.em.findOneOrFail(User, { value: 'test' });
    expect(res.value).toBe('test');

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock).not.toBeCalled();
  });

  test('em.flush() with various JSON values', async () => {
    orm.em.create(User, { value: { foo: 'test' } });
    await orm.em.flush();
    orm.em.clear();

    const res = await orm.em.findOneOrFail(User, { value: { foo: 'test' } });
    expect(res.value).toEqual({ foo: 'test' });

    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock).not.toBeCalled();

    res.value = 'bar';
    await orm.em.flush();
    expect(mock).toBeCalled();
    mock.mockReset();
    await orm.em.flush();
    expect(mock).not.toBeCalled();

    res.value = 123;
    await orm.em.flush();
    expect(mock).toBeCalled();
    mock.mockReset();
    await orm.em.flush();
    expect(mock).not.toBeCalled();

    res.value = [1, 2, 3];
    await orm.em.flush();
    expect(mock).toBeCalled();
    mock.mockReset();
    await orm.em.flush();
    expect(mock).not.toBeCalled();

    res.value = false;
    await orm.em.flush();
    expect(mock).toBeCalled();
    mock.mockReset();
    await orm.em.flush();
    expect(mock).not.toBeCalled();

    wrap(res).assign({ value: { lol: true } });
    await orm.em.flush();
    expect(mock).toBeCalled();
    mock.mockReset();
    await orm.em.flush();
    expect(mock).not.toBeCalled();
  });

  test('find with special characters in JSON property key', async () => {
    const key1 = ':123';
    const key2 = '#123';
    const key3 = ' 123';
    const key4 = '123';
    // mongo does not support dots in key name: https://www.mongodb.com/docs/manual/reference/limits/#Restrictions-on-Field-Names
    const key5 = type === 'mongo' ? '123' : '.123';

    await orm.em.insert(User, {
      value: {
        [key1]: 'test 1',
        [key2]: 'test 2',
        [key3]: 'test 3',
        [key4]: 'test 4',
        [key5]: 'test 5',
      },
    });

    const res = await orm.em.findOneOrFail(User, {
      value: {
        [key1]: 'test 1',
        [key2]: 'test 2',
        [key3]: 'test 3',
        [key4]: 'test 4',
        [key5]: 'test 5',
      },
    });
    expect(res.value).toEqual({
      [key1]: 'test 1',
      [key2]: 'test 2',
      [key3]: 'test 3',
      [key4]: 'test 4',
      [key5]: 'test 5',
    });
  });

});
