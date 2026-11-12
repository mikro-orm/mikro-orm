import { Collection, defineEntity, MikroORM, p, ref, Reference, ScalarReference, Utils } from '@mikro-orm/sqlite';

const Author = defineEntity({
  name: 'WrapperDetectionAuthor',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ dbName: ':memory:', entities: [Author] });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

function wrappers() {
  const em = orm.em.fork();
  const author = em.create(Author, { id: 1, name: 'a' });
  return { collection: new Collection(author), reference: ref(author), scalar: new ScalarReference('v') };
}

function detect(value: unknown) {
  return [
    Collection.isCollection(value),
    Utils.isCollection(value),
    Reference.isReference(value),
    Utils.isEntity(value, true),
    ScalarReference.isScalarReference(value),
    Utils.isScalarReference(value),
  ];
}

test('real wrapper instances are detected', () => {
  const { collection, reference, scalar } = wrappers();
  class CustomCollection<T extends object> extends Collection<T> {}

  expect(Collection.isCollection(collection)).toBe(true);
  expect(Collection.isCollection(new CustomCollection({}))).toBe(true);
  expect(Utils.isCollection(collection)).toBe(true);
  expect(Reference.isReference(reference)).toBe(true);
  expect(Utils.isEntity(reference, true)).toBe(true);
  expect(ScalarReference.isScalarReference(scalar)).toBe(true);
  expect(Utils.isScalarReference(scalar)).toBe(true);

  expect(Collection.isCollection(reference)).toBe(false);
  expect(Reference.isReference(collection)).toBe(false);
  expect(ScalarReference.isScalarReference(reference)).toBe(false);
});

test('wrapper markers are not own or enumerable properties of instances', () => {
  for (const wrapper of Object.values(wrappers())) {
    expect(Object.getOwnPropertySymbols(wrapper)).toEqual([]);
  }
});

test('copies of wrapper instances are not detected as wrappers', () => {
  for (const wrapper of Object.values(wrappers())) {
    expect(detect({ ...wrapper })).not.toContain(true);
    expect(detect(Object.assign({}, wrapper))).not.toContain(true);
    expect(detect(JSON.parse(JSON.stringify(wrapper)))).not.toContain(true);
  }
});

test('plain objects and JSON payloads are not detected as wrappers', () => {
  const values: unknown[] = [
    null,
    undefined,
    1,
    'str',
    {},
    [],
    { __collection: true, __reference: true, __scalarReference: true },
  ];
  const payloads = [
    '{"__collection":true,"__reference":true,"__scalarReference":true}',
    '{"__proto__":{"__collection":true,"__reference":true,"__scalarReference":true}}',
    '{"__proto__":{"Symbol(@mikro-orm/core/Collection)":true,"@mikro-orm/core/Collection":true,"@mikro-orm/core/Reference":true,"@mikro-orm/core/ScalarReference":true}}',
  ];

  for (const payload of payloads) {
    const parsed = JSON.parse(payload);
    const copied: Record<string, unknown> = {};

    for (const key in parsed) {
      copied[key] = parsed[key];
    }

    values.push(parsed, Object.assign({}, parsed), { ...parsed }, copied, structuredClone(parsed));
  }

  for (const value of values) {
    expect(detect(value)).not.toContain(true);
  }
});
