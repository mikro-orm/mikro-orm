import { ObjectId } from 'mongodb';
import { Entity, PrimaryKey, Property, MikroORM, Dictionary } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class Entity401 {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  data: Dictionary;

  @Property()
  bar?: string;

  constructor(data = {}) {
    this.data = data;
  }

}

describe('GH issue 401', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Entity401],
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs0',
      type: 'mongo',
    });
    await orm.em.nativeDelete(Entity401, {});
  });

  afterAll(() => orm.close(true));

  test('do not automatically convert string to ObjectId in the all cases', async () => {
    const id = '0000007b5c9c61c332380f78';
    const a = new Entity401({ foo: id });
    a.bar = id;
    expect(a.data.foo).toBe(id);
    expect(a.bar).toBe(id);
    await orm.em.persistAndFlush(a);
    expect(a.data.foo).not.toBeInstanceOf(ObjectId);
    expect(a.bar).not.toBeInstanceOf(ObjectId);
    orm.em.clear();

    const getA = await orm.em.findOneOrFail(Entity401, a._id);
    expect(getA!.data.foo).not.toBeInstanceOf(ObjectId);
    expect(getA!.bar).not.toBeInstanceOf(ObjectId);
    orm.em.clear();

    const getA2 = await orm.em.findOneOrFail(Entity401, { bar: id });
    expect(getA2!.data.foo).not.toBeInstanceOf(ObjectId);
    expect(getA2!.bar).not.toBeInstanceOf(ObjectId);
  });

});
