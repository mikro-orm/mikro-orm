import { MikroORM, OptionalProps, raw } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class A {
  [OptionalProps]?: 'foo1' | 'foo2' | 'foo3' | 'bar' | 'rawDefault' | 'version';

  @PrimaryKey()
  id!: number;

  @Property({ default: 50 })
  foo1!: number;

  @Property({ default: 50 })
  foo2: number = 50;

  @Property()
  foo3: number = 50;

  @Property({ default: 'hello' })
  bar!: string;

  @Property({ default: raw('current_timestamp') })
  rawDefault!: string;

  @Property({ version: true })
  version!: number;
}

describe('default values in sqlite', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test(`database defaults will be available after flush`, async () => {
    const mock = mockLogger(orm, ['query']);

    const a = new A();
    expect(a.foo1).toBeUndefined();
    expect(a.foo2).toBe(50);
    expect(a.foo3).toBe(50);
    expect(a.version).toBeUndefined();
    await orm.em.persist(a).flush();

    // sqlite needs to reload via separate select query (inside tx, so 4 in total)
    expect(mock).toHaveBeenCalledTimes(3);
    expect(a.foo1).toBe(50);
    expect(a.foo2).toBe(50);
    expect(a.foo3).toBe(50);
    expect(a.version).toBe(1);
  });

  test('em.create() applies default values immediately', async () => {
    const em = orm.em.fork();

    // default values should be applied by em.create()
    const a = em.create(A, {});
    expect(a.foo1).toBe(50);
    expect(a.foo2).toBe(50);
    expect(a.foo3).toBe(50);
    expect(a.bar).toBe('hello');
    // raw SQL defaults should NOT be applied in-memory
    expect(a.rawDefault).toBeUndefined();
  });

  test('em.create() does not override user-provided values', async () => {
    const em = orm.em.fork();

    const a = em.create(A, { foo1: 100, bar: 'world' });
    expect(a.foo1).toBe(100);
    expect(a.bar).toBe('world');
  });

  test('default values are applied during flush for new A()', async () => {
    const em = orm.em.fork();
    const mock = mockLogger(orm, ['query']);

    const a = new A();
    expect(a.foo1).toBeUndefined();
    expect(a.bar).toBeUndefined();
    em.persist(a);
    await em.flush();

    expect(a.foo1).toBe(50);
    expect(a.bar).toBe('hello');
    // raw default gets resolved by the database
    expect(a.rawDefault).toBeDefined();
  });
});
