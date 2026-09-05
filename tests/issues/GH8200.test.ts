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
  expect(person.type).toBe('person'); // assigned already at create time, not only at flush
  await orm.em.flush();

  expect(person.type).toBe('person');
});

test('explicitly passed discriminator value is kept', async () => {
  const person = orm.em.create(Person, { name: 'Bar', type: 'person' });
  expect(person.type).toBe('person');
  await orm.em.flush();
  orm.em.clear();

  const reloaded = await orm.em.findOneOrFail(Person, { name: 'Bar' });
  expect(reloaded.type).toBe('person');
});
