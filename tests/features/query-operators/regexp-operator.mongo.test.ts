import { defineEntity, MikroORM, ObjectId, p } from '@mikro-orm/mongodb';

const Person = defineEntity({
  name: 'Person',
  properties: {
    _id: p.type(ObjectId).primary(),
    name: p.string(),
    fullName: p.string().fieldName('full_name'),
    items: p.json<{ name: string }[]>().nullable(),
    tags: p.json<string[]>().nullable(),
    meta: p.json<Record<string, unknown>>().nullable(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Person],
    clientUrl: 'mongodb://localhost:27017/mikro-orm-test-regexp-operator',
  });
  await orm.schema.clear();
  const em = orm.em.fork();
  em.create(Person, { name: 'john', fullName: 'John Smith', items: [{ name: 'apple' }], tags: ['red'] });
  em.create(Person, { name: 'jane', fullName: 'Jane Doe', items: [{ name: 'banana' }], tags: ['yellow'] });
  await em.flush();
});

afterAll(async () => {
  await orm.schema.drop();
  await orm.close(true);
});

test('$re on a property with a custom field name', async () => {
  const res = await orm.em.fork().find(Person, { fullName: { $re: '^John' } });
  expect(res.map(r => r.name)).toEqual(['john']);
});

test('$re next to other operators keeps them', async () => {
  const res = await orm.em.fork().find(Person, { name: { $re: '^j', $ne: 'jane' } });
  expect(res.map(r => r.name)).toEqual(['john']);
});

test('$re under $not', async () => {
  const res = await orm.em.fork().find(Person, { name: { $not: { $re: '^jo' } } });
  expect(res.map(r => r.name)).toEqual(['jane']);
});

test('$re inside $elemMatch', async () => {
  const em = orm.em.fork();
  const res1 = await em.find(Person, { items: { $elemMatch: { name: { $re: '^ap' } } } });
  expect(res1.map(r => r.name)).toEqual(['john']);
  const res2 = await em.find(Person, { items: { $elemMatch: { $or: [{ name: { $re: '^ban' } }] } } });
  expect(res2.map(r => r.name)).toEqual(['jane']);
  // operator arrays other than `$and`/`$or` hold values, not conditions
  const res3 = await em.find(Person, { tags: { $elemMatch: { $in: ['red'] } } } as any);
  expect(res3.map(r => r.name)).toEqual(['john']);
});

test('$re in a cloned entity condition', async () => {
  const em = orm.em.fork();
  const clone = await em.clone(Person, { fullName: { $re: '^Jane' } }, { name: 'jane-clone' });
  expect(clone.fullName).toBe('Jane Doe');
  await em.remove(clone).flush();
});

test('$re key in JSON data is stored as-is', async () => {
  const em = orm.em.fork();
  const person = em.create(Person, { name: 'jim', fullName: 'Jim Beam', meta: { $re: 'insert' } });
  await em.flush();
  expect((await orm.em.fork().findOneOrFail(Person, person._id)).meta).toEqual({ $re: 'insert' });

  person.meta = { $re: 'update' };
  await em.flush();
  expect((await orm.em.fork().findOneOrFail(Person, person._id)).meta).toEqual({ $re: 'update' });
  await em.remove(person).flush();
});
