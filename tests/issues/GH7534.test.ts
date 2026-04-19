import { Collection, defineEntity, MikroORM, p, ref, Reference, ScalarReference } from '@mikro-orm/sqlite';

// GH #7534: `referenceSymbol`, `scalarReferenceSymbol`, and `collectionSymbol`
// must use globally-registered Symbol.for() to survive the CJS/ESM dual-package
// hazard, just like `entitySymbol` was fixed in #7515.

const User = defineEntity({
  name: 'User7534',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

test('Reference/Collection/ScalarReference markers survive dual module copies (#7534)', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.create();

  const user = orm.em.create(User, { name: 'Foo' });
  await orm.em.flush();

  // A second module copy would resolve these markers via Symbol.for(...)
  // and see the same values installed by the first copy.
  const refSym = Symbol.for('@mikro-orm/core/Reference');
  const colSym = Symbol.for('@mikro-orm/core/Collection');
  const scalarRefSym = Symbol.for('@mikro-orm/core/ScalarReference');

  // Reference marker
  const wrapped = ref(user);
  expect((wrapped as any)[refSym]).toBe(true);
  expect(Reference.isReference(wrapped)).toBe(true);

  // Collection marker
  const col = new Collection(user);
  expect((col as any)[colSym]).toBe(true);
  expect(Collection.isCollection(col)).toBe(true);

  // ScalarReference marker
  const sr = new ScalarReference('test');
  expect((sr as any)[scalarRefSym]).toBe(true);
  expect(ScalarReference.isScalarReference(sr)).toBe(true);

  await orm.close(true);
});
