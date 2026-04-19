import { defineEntity, MikroORM, p, Utils } from '@mikro-orm/sqlite';

// GH #7515: rationale lives next to `entitySymbol` in `EntityHelper.ts`.

const UserSchema = defineEntity({
  name: 'User7515',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

class User7515 extends UserSchema.class {}

UserSchema.setClass(User7515);

test('isEntity uses a globally registered marker so dual module copies agree', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User7515],
  });
  await orm.schema.create();

  const user = orm.em.create(User7515, { name: 'Foo' });

  // A second module copy would resolve the marker via `Symbol.for(...)` and
  // see the same value installed by the first copy's `decorate`.
  const entitySymbol = Symbol.for('@mikro-orm/core/EntityHelper.entity');
  expect((user as any)[entitySymbol]).toBe(true);

  // Sanity check the actual fix: persist must work without throwing.
  orm.em.persist(user);
  await orm.em.flush();

  // JSON-shaped payloads still get rejected — symbols have no JSON form.
  expect(Utils.isEntity({ __entity: true })).toBe(false);

  await orm.close(true);
});
