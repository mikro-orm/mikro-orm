import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const BasePerson = defineEntity({
  name: 'BasePerson',
  abstract: true,
  discriminatorColumn: 'type',
  properties: {
    id: p.integer().primary(),
    type: p.text(),
  },
});

const Person = defineEntity({
  name: 'Person',
  extends: BasePerson,
  discriminatorValue: 'person',
  properties: {
    name: p.text(),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Person],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('discriminator value is not required when creating an STI entity', async () => {
  const person = orm.em.create(Person, { name: 'Foo' });
  await orm.em.flush();

  expect(person.type).toBe('person');
});
