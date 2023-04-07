import { MikroORM, Entity, PrimaryKey, Property, SimpleLogger, Utils, IDatabaseDriver, sql } from '@mikro-orm/core';
import { mockLogger } from '../../helpers';
import { PLATFORMS } from '../../bootstrap';

@Entity()
export class User {

  static id = 1;

  @PrimaryKey({ name: '_id' })
  id: number = User.id++;

  @Property({ type: 'json' })
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

describe.each(Utils.keys(options))('JSON properties [%s]',  type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [User],
      driver: PLATFORMS[type],
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

    await orm.em.insert(User, { value: [1, 2, 3] });
    const val = type === 'mysql' ? sql`json_array(1, 2, 3)` : [1, 2, 3];
    const res3 = await orm.em.findOneOrFail(User, { value: { $eq: val } });
    expect(res3.value).toEqual([1, 2, 3]);
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

    res.value = { lol: true };
    await orm.em.flush();
    expect(mock).toBeCalled();
    mock.mockReset();
    await orm.em.flush();
    expect(mock).not.toBeCalled();
  });

});
