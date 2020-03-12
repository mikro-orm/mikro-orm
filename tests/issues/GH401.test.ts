import { ObjectId } from 'mongodb';
import { Entity, PrimaryKey, Property, MikroORM, ReflectMetadataProvider, Dictionary } from '../../lib';
import { SqliteDriver } from '../../lib/drivers/SqliteDriver';

@Entity()
class A {

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
      entities: [A],
      dbName: `mikro_orm_test_gh_401`,
      debug: false,
      highlight: false,
      type: 'mongo',
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
  });

  afterAll(() => orm.close(true));

  test('do not automatically convert string to ObjectId in the all cases', async () => {
    const a = new A({ foo: '0000007b5c9c61c332380f78' });
    expect(a.data.foo).toBe('0000007b5c9c61c332380f78');
    await orm.em.persistAndFlush(a);
    expect(a.data.foo).not.toBeInstanceOf(ObjectId);
    orm.em.clear();

    const getA = await orm.em.findOneOrFail(A, a._id);
    expect(getA!.data.foo).not.toBeInstanceOf(ObjectId);
  });

});
