import { UnderscoreNamingStrategy } from '@mikro-orm/core';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/mongodb';

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

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [A],
    clientUrl: 'mongodb://localhost:27017/mikro-orm-4371',
    namingStrategy: UnderscoreNamingStrategy,
  });
  await orm.schema.clear();

  await orm.em.persist(new A()).flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close();
});

test('Ensure that embedded entity has underscore naming and fieldName is applied', async () => {
  const collection = orm.em.getCollection('a');
  expect(await collection.findOne({}, { projection: { _id: 0 } })).toEqual({
    complex_name: 'n',
    em_bedded: {
      camel_case: 'c',
      alias: 'w',
    },
  });
});

test('Read entity correctly', async () => {
  const entities = await orm.em.find(A, {});
  expect(entities[0].emBedded).toMatchObject({
    camelCase: 'c',
    someField: 'w',
  });
});
