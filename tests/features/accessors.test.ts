import { defineEntity, Dictionary, MikroORM, Opt, p, serialize } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { inspect } from 'node:util';

const usageMap = {} as Dictionary<[get: number, set: number]>;

@Entity({ tableName: 'user' })
class User11 {

  @PrimaryKey()
  id!: number;

  @Property({ version: true, hidden: true, type: 'integer' })
  version: number & Opt = 1;

  private _foo!: unknown;

  // `accessor: '_foo'` on the get/set property means the ORM will skip the getter/setter and work with the backing variable directly
  @Property({ type: 'jsonb', accessor: '_foo' })
  get foo(): unknown {
    usageMap.User11 ??= [0, 0];
    usageMap.User11[0]++;
    return structuredClone(this._foo);
  }

  set foo(untrusted: unknown) {
    usageMap.User11 ??= [0, 0];
    usageMap.User11[1]++;
    this._foo = structuredClone(untrusted);
  }

}

@Entity({ forceConstructor: true, tableName: 'user' })
class User12 {

  @PrimaryKey()
  id!: number;

  @Property({ version: true, hidden: true, type: 'integer' })
  version: number & Opt = 1;

  #foo!: unknown;

  // `accessor: true` on the getter/setter means the ORM will always work with this property through the getter/setter
  @Property({ type: 'jsonb', accessor: true })
  get foo(): unknown {
    usageMap.User12 ??= [0, 0];
    usageMap.User12[0]++;
    return structuredClone(this.#foo);
  }

  set foo(untrusted: unknown) {
    usageMap.User12 ??= [0, 0];
    usageMap.User12[1]++;
    this.#foo = structuredClone(untrusted);
  }

}

@Entity({ tableName: 'user' })
class User13 {

  @PrimaryKey()
  id!: number;

  @Property({ version: true, hidden: true, type: 'integer' })
  version: number & Opt = 1;

  // `accessor: 'foo'` on the backing property means the ORM will skip the getter/setter and work with the backing variable directly
  @Property({ type: 'jsonb', accessor: 'foo' })
  private _foo!: unknown;

  get foo(): unknown {
    usageMap.User13 ??= [0, 0];
    usageMap.User13[0]++;
    return structuredClone(this._foo);
  }

  set foo(untrusted: unknown) {
    usageMap.User13 ??= [0, 0];
    usageMap.User13[1]++;
    this._foo = structuredClone(untrusted);
  }

}

class User22 {

  id!: number;
  version: number & Opt = 1;
  private _foo!: unknown;

  get foo(): unknown {
    usageMap.User22 ??= [0, 0];
    usageMap.User22[0]++;
    return structuredClone(this._foo);
  }

  set foo(untrusted: unknown) {
    usageMap.User22 ??= [0, 0];
    usageMap.User22[1]++;
    this._foo = structuredClone(untrusted);
  }

}

const User22Schema = defineEntity({
  class: User22,
  tableName: 'user',
  properties: {
    id: p.integer().primary(),
    version: p.integer().version().hidden(),
    foo: p.json().accessor('_foo'),
  },
});

class User23 {

  id!: number;
  version: number & Opt = 1;
  #foo!: unknown;

  get foo(): unknown {
    usageMap.User23 ??= [0, 0];
    usageMap.User23[0]++;
    return structuredClone(this.#foo);
  }

  set foo(untrusted: unknown) {
    usageMap.User23 ??= [0, 0];
    usageMap.User23[1]++;
    this.#foo = structuredClone(untrusted);
  }

}

const User23Schema = defineEntity({
  class: User23,
  tableName: 'user',
  forceConstructor: true,
  properties: {
    id: p.integer().primary(),
    version: p.integer().version().hidden(),
    foo: p.json().accessor(),
  },
});

describe.each([User11, User13, User22] as const)('accessors with direct backing property access (%o)', Entity => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Entity],
      discovery: { inferDefaultValues: false }, // otherwise getters would be used during discovery
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('schema', async () => {
    const dump = await orm.schema.getCreateSchemaSQL();
    expect(dump.trim()).toBe('create table `user` (`id` integer not null primary key autoincrement, `version` integer not null default 1, `foo` json not null);');
  });

  test('working with accessors', async () => {
    const entityName = Entity.prototype.constructor.name;
    usageMap[entityName] = undefined!;

    const e = orm.em.create(Entity, { foo: { name: 'test' } });

    if (['User12', 'User23'].includes(entityName)) {
      expect(inspect(e)).toEqual(`${entityName} { _foo: { name: 'test' }, version: 1 }`);
    } else {
      expect(inspect(e)).toEqual(`${entityName} { version: 1, _foo: { name: 'test' } }`);
    }

    expect(usageMap[entityName]).toBeUndefined();
    await orm.em.flush();
    orm.em.clear();

    await orm.em.transactional(async em => {
      const users = await em.findAll(Entity);
      expect(users.length).toBe(1);
      expect(users[0].version).toBe(1);
      expect(usageMap[entityName]).toBeUndefined();
      expect(users[0].foo).toEqual({ name: 'test' });
      expect(usageMap[entityName]).toEqual([1, 0]);
    });
    orm.em.clear();

    const users = await orm.em.findAll(Entity);
    expect(users.length).toBe(1);
    expect(users[0].version).toBe(1);
    expect(usageMap[entityName]).toEqual([1, 0]);
    expect(users[0].foo).toEqual({ name: 'test' });
    expect(usageMap[entityName]).toEqual([2, 0]);

    users[0].foo = { name: 'test2' };
    expect(usageMap[entityName]).toEqual([2, 1]);
    await orm.em.flush();

    expect(JSON.stringify(users[0])).toBe('{"id":1,"foo":{"name":"test2"}}');
    expect(serialize(users[0])).toEqual({ id: 1, foo: { name: 'test2' } });
    expect(usageMap[entityName]).toEqual([2, 1]);
  });
});

describe.each([User12, User23] as const)('accessors with opaque backing property (%o)', Entity => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Entity],
      discovery: { inferDefaultValues: false }, // otherwise getters would be used during discovery
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('schema', async () => {
    const dump = await orm.schema.getCreateSchemaSQL();
    expect(dump.trim()).toBe('create table `user` (`id` integer not null primary key autoincrement, `version` integer not null default 1, `foo` json not null);');
  });

  test('working with accessors', async () => {
    const entityName = Entity.prototype.constructor.name;
    usageMap[entityName] = undefined!;

    const e = orm.em.create(Entity, { foo: { name: 'test' } });
    expect(usageMap[entityName]).toEqual([0, 1]);
    expect(inspect(e)).toEqual(`${entityName} { version: 1, foo: { name: 'test' } }`);
    expect(usageMap[entityName]).toEqual([1, 1]);
    await orm.em.flush();
    expect(usageMap[entityName]).toEqual([4, 1]);
    orm.em.clear();

    await orm.em.transactional(async em => {
      const users = await em.findAll(Entity);
      expect(users.length).toBe(1);
      expect(users[0].version).toBe(1);
      expect(usageMap[entityName]).toEqual([4, 2]);
      expect(users[0].foo).toEqual({ name: 'test' });
      expect(usageMap[entityName]).toEqual([5, 2]);
    });
    orm.em.clear();

    const users = await orm.em.findAll(Entity);
    expect(users.length).toBe(1);
    expect(users[0].version).toBe(1);
    expect(usageMap[entityName]).toEqual([7, 3]);
    expect(users[0].foo).toEqual({ name: 'test' });
    expect(usageMap[entityName]).toEqual([8, 3]);

    users[0].foo = { name: 'test2' };
    expect(usageMap[entityName]).toEqual([8, 4]);
    await orm.em.flush();
    expect(usageMap[entityName]).toEqual([12, 4]);

    expect(JSON.stringify(users[0])).toBe('{"id":1,"foo":{"name":"test2"}}');
    expect(serialize(users[0])).toEqual({ id: 1, foo: { name: 'test2' } });
    expect(usageMap[entityName]).toEqual([22, 4]);
  });
});
