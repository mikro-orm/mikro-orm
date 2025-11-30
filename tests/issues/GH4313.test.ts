import { MikroORM, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MongoDriver } from '@mikro-orm/mongodb';
import { randomUUID } from 'node:crypto';

@Entity()
export class A {

  @PrimaryKey()
  _id = randomUUID();

  @Property()
  complexName!: string;

}

let orm: MikroORM<MongoDriver>;

describe('GH issue 4313', () => {

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test-4313',
      driver: MongoDriver,
      namingStrategy: UnderscoreNamingStrategy,
    });
    await orm.schema.clear();

    const a = new A();
    a.complexName = 'a';
    const b = new A();
    b.complexName = 'b';
    await orm.em.persistAndFlush([a, b]);
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close();
  });

  test('Find with sort by complexName field that is camel case string', async () => {
    const data1 = await orm.em.find(A, {}, {
      orderBy: { complexName: 'asc' },
    });
    expect(data1[0].complexName).toBe('a');

    const data2 = await orm.em.find(A, {}, {
      orderBy: { complexName: 'desc' },
    });
    expect(data2[0].complexName).toBe('b');

    const data3 = await orm.em.find(A, {}, {
      orderBy: [{ complexName: 'asc' }],
    });
    expect(data3[0].complexName).toBe('a');

    const data4 = await orm.em.find(A, {}, {
      orderBy: [{ complexName: 'desc' }],
    });
    expect(data4[0].complexName).toBe('b');

  });

  test('FindOne with sort by complexName field that is camel case string', async () => {
    const data1 = await orm.em.findOne(A, { complexName: { $ne: null } }, {
      orderBy: { complexName: 'asc' },
    });
    expect(data1!.complexName).toBe('a');

    const data2 = await orm.em.findOne(A, { complexName: { $ne: null } }, {
      orderBy: { complexName: 'desc' },
    });
    expect(data2!.complexName).toBe('b');

    const data3 = await orm.em.findOne(A, { complexName: { $ne: null } }, {
      orderBy: [{ complexName: 'asc' }],
    });
    expect(data3!.complexName).toBe('a');

    const data4 = await orm.em.findOne(A, { complexName: { $ne: null } }, {
      orderBy: [{ complexName: 'desc' }],
    });
    expect(data4!.complexName).toBe('b');
  });
});
