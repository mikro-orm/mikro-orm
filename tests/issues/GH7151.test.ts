import { MikroORM, defineEntity, p } from '@mikro-orm/sqlite';

const User7151 = defineEntity({
  name: 'User7151',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User7151],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('calling toJSON on entity prototype should not corrupt subsequent queries (GH7151)', async () => {
  // Create and persist an entity
  orm.em.create(User7151, { id: 1, name: 'Test User' });
  await orm.em.flush();
  orm.em.clear();

  // Simulate what Pino's safe-stable-stringify does when it walks
  // the EntityManager's metadata graph and finds entity prototypes.
  // It calls toJSON() on the prototype itself, not on an instance.
  const meta = orm.getMetadata().get(User7151);
  const prototype = meta.prototype as any;
  expect(typeof prototype.toJSON).toBe('function');

  // Verify __helper is initially a getter on prototype, not an own property
  const descriptorBefore = Object.getOwnPropertyDescriptor(prototype, '__helper');
  expect(descriptorBefore?.get).toBeDefined();

  // This is what triggers the bug - calling toJSON on the prototype
  // When toJSON calls EntityTransformer.toObject(this) with this=prototype,
  // it invokes helper(this) which accesses __helper getter on the prototype.
  // Without the fix, this replaces the getter with a value on the prototype itself.
  const result = prototype.toJSON();

  // The fix should return an empty object when called on prototype
  expect(result).toEqual({});

  // Verify __helper is still a getter after calling toJSON (the fix prevents corruption)
  const descriptorAfter = Object.getOwnPropertyDescriptor(prototype, '__helper');
  expect(descriptorAfter?.get).toBeDefined();

  // Without the fix, this would fail because:
  // 1. __helper getter is replaced with a WrappedEntity value on prototype
  // 2. New entity instances inherit this broken __helper
  // 3. Utils.isEntity() checks get confused, treating plain objects as entities
  // 4. QueryHelper.processParams() collapses where clause to {}, causing validation error
  const user = await orm.em.findOne(User7151, { id: 1 });
  expect(user).not.toBeNull();
  expect(user!.name).toBe('Test User');
});
