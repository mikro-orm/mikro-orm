import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';

@Embeddable()
class E {

  @Property()
  camelCase: string = 'c';

  @Property({ fieldName: 'alias' })
  someField: string = 'w';

}

@Entity()
class A {

  @PrimaryKey()
  _id = '1';

  @Property()
  complexName = 'n';

  @Embedded({ entity: () => E, object: true })
  emBedded = new E();

}

let orm: MikroORM<MongoDriver>;

describe('GH issue 4371', () => {
  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test',
      driver: MongoDriver,
      namingStrategy: UnderscoreNamingStrategy,
    });
    await orm.schema.clearDatabase();

    await orm.em.persistAndFlush(new A());
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close();
  });

  test('Ensure that embedded entity has underscore naming and fieldName is applied', async () => {
    const collection = orm.em.getDriver().getConnection().getDb().collection('a');
    expect(await collection.findOne({},{ projection:{ _id:0 } })).toEqual({
      complex_name: 'n',
      em_bedded: {
        camel_case: 'c',
        alias: 'w',
      },
    });
  });
});
