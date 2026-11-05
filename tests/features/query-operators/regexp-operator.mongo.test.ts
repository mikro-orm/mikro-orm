import { defineEntity, MikroORM, ObjectId, p } from '@mikro-orm/mongodb';

const Person = defineEntity({
  name: 'Person',
  properties: {
    _id: p.type(ObjectId).primary(),
    name: p.string(),
    fullName: p.string().fieldName('full_name'),
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
  em.create(Person, { name: 'john', fullName: 'John Smith' });
  em.create(Person, { name: 'jane', fullName: 'Jane Doe' });
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
