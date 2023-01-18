import { Entity, PrimaryKey, Property, MikroORM } from '@mikro-orm/core';
import { mockLogger } from '../../helpers';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property({ default: 50 })
  foo1!: number;

  @Property({ default: 50 })
  foo2: number = 50;

  @Property()
  foo3: number = 50;

  @Property({ version: true })
  version!: number;

}

describe('default values in sqlite', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: `:memory:`,
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`database defaults will be available after flush`, async () => {
    const mock = mockLogger(orm, ['query']);

    const a = new A();
    expect(a.foo1).toBeUndefined();
    expect(a.foo2).toBe(50);
    expect(a.foo3).toBe(50);
    expect(a.version).toBeUndefined();
    await orm.em.persistAndFlush(a);

    // sqlite needs to reload via separate select query (inside tx, so 4 in total)
    expect(mock).toBeCalledTimes(3);
    expect(a.foo1).toBe(50);
    expect(a.foo2).toBe(50);
    expect(a.foo3).toBe(50);
    expect(a.version).toBe(1);
  });

});
