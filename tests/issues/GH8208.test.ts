import { type EventArgs, type EventSubscriber, Type, ValidationError } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

// Minifiers (e.g. Turbopack) can mangle two entity classes from different module scopes
// to the same short name. Lookups that resolve a user-supplied class must key by class
// reference, not by class name.
function defineEntityA() {
  @Entity({ tableName: 'gh8208_a' })
  class d {
    @PrimaryKey({ type: 'number' })
    id!: number;

    @Property({ type: 'string' })
    name!: string;
  }

  return d;
}

const EntityA = defineEntityA();

function defineEntityB() {
  @Entity({ tableName: 'gh8208_b' })
  class d {
    @PrimaryKey({ type: 'number' })
    id!: number;

    @Property({ type: 'string' })
    name!: string;
  }

  return d;
}

const EntityB = defineEntityB();

test('event subscribers match subscribed entities by class reference', async () => {
  const calls: string[] = [];

  class Subscriber implements EventSubscriber {
    getSubscribedEntities() {
      return [EntityA];
    }

    beforeCreate(args: EventArgs<any>) {
      calls.push(args.entity.constructor === EntityA ? 'A' : 'B');
    }
  }

  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [EntityA, EntityB],
    subscribers: [new Subscriber()],
  });
  await orm.schema.create();

  orm.em.create(EntityA, { name: 'a1' });
  orm.em.create(EntityB, { name: 'b1' });
  await orm.em.flush();

  expect(calls).toEqual(['A']);
  await orm.close(true);
});

test('em.addFilter with entity restriction matches by class reference', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [EntityA, EntityB],
  });
  await orm.schema.create();

  orm.em.create(EntityA, { name: 'match' });
  orm.em.create(EntityA, { name: 'other' });
  orm.em.create(EntityB, { name: 'other' });
  await orm.em.flush();
  orm.em.clear();

  orm.em.addFilter({ name: 'named', cond: { name: 'match' }, entity: [EntityA] });

  // the filter applies to `EntityA`...
  await expect(orm.em.find(EntityA, {})).resolves.toHaveLength(1);
  // ...but not to `EntityB`, which only shares the mangled class name
  await expect(orm.em.find(EntityB, {})).resolves.toHaveLength(1);

  await orm.close(true);
});

test('Type.getType caches instances by class reference', () => {
  function defineType1() {
    class a extends Type<string, string> {}

    return a;
  }

  function defineType2() {
    class a extends Type<string, string> {}

    return a;
  }

  const Type1 = defineType1();
  const Type2 = defineType2();

  expect(Type.getType(Type1)).toBeInstanceOf(Type1);
  expect(Type.getType(Type2)).toBeInstanceOf(Type2);
});

test('repository type validation compares metadata identity, not class names', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [EntityA, EntityB],
  });
  await orm.schema.create();

  const repoA = orm.em.getRepository(EntityA);
  const a = orm.em.create(EntityA, { name: 'a1' });
  const b = orm.em.create(EntityB, { name: 'b1' });

  expect(() => repoA.assign(a, { name: 'a2' })).not.toThrow();
  expect(() => repoA.assign(b as any, { name: 'b2' })).toThrow(ValidationError);

  await orm.close(true);
});

test('forceEntityConstructor matches entities by class reference', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [EntityA, EntityB],
    forceEntityConstructor: [EntityA],
  });

  expect(orm.getMetadata().get(EntityA).forceConstructor).toBe(true);
  expect(orm.getMetadata().get(EntityB).forceConstructor).toBe(false);

  await orm.close(true);
});
