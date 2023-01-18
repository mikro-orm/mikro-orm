import { ObjectId } from 'bson';
import { Entity, PrimaryKey, Property, Dictionary } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mongodb';

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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Entity401],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test',
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
