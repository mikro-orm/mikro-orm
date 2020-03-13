import { ObjectId } from 'mongodb';
import { Entity, PrimaryKey, Property, MikroORM, ReflectMetadataProvider, Dictionary } from '../../lib';
import { SqliteDriver } from '../../lib/drivers/SqliteDriver';

@Entity()
class Entity401 {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  data: Dictionary;

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
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
    await orm.em.remove(Entity401, {});
  });

  afterAll(() => orm.close(true));

  test('do not automatically convert string to ObjectId in the all cases', async () => {
    const a = new Entity401({ foo: '0000007b5c9c61c332380f78' });
    expect(a.data.foo).toBe('0000007b5c9c61c332380f78');
    await orm.em.persistAndFlush(a);
    expect(a.data.foo).not.toBeInstanceOf(ObjectId);
    orm.em.clear();

    const getA = await orm.em.findOneOrFail(Entity401, a._id);
    expect(getA!.data.foo).not.toBeInstanceOf(ObjectId);
  });

});
