import { Entity, PrimaryKey, Property, MikroORM } from '@mikro-orm/core';
import { mockLogger } from '../../helpers.js';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

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

describe('default values in postgres', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: `mikro_orm_test_default_values`,
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
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

    // postgres uses returning clause, so just a single insert query (inside tx, so 3 in total)
    expect(mock).toHaveBeenCalledTimes(3);
    expect(a.foo1).toBe(50);
    expect(a.foo2).toBe(50);
    expect(a.foo3).toBe(50);
    expect(a.version).toBe(1);
  });

});
