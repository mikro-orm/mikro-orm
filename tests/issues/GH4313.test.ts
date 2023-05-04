import { Entity, MikroORM, PrimaryKey, Property, UnderscoreNamingStrategy } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import { randomUUID } from 'crypto';

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
      entities: [A],
      clientUrl: 'mongodb://localhost:27017/mikro-orm-test',
      driver: MongoDriver,
      namingStrategy: UnderscoreNamingStrategy,
    });
    await orm.schema.clearDatabase();

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
