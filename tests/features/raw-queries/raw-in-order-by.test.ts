import { MikroORM, raw, wrap, serialize } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('#5129', async () => {
  const lengthOfTruncatedNameQuery = raw<string>(alias => `length(substr(${alias}.name, 0, :maxLength))`, {
    maxLength: 3,
  });

  await orm.em.find(
    User,
    { [lengthOfTruncatedNameQuery]: { $lte: 5 } },
    { orderBy: { [lengthOfTruncatedNameQuery]: 'ASC' } },
  );

  expect(lengthOfTruncatedNameQuery.toString()).toBe(`[object raw('length(substr([::alias::].name, 0, ?))')]`);

  const e = new User('n', 'e');
  e.name = lengthOfTruncatedNameQuery;
  expect(() => wrap(e).toObject()).toThrow(
    `Trying to serialize raw SQL fragment: 'length(substr([::alias::].name, 0, ?))'`,
  );
  expect(() => JSON.stringify(e)).toThrow(
    `Trying to serialize raw SQL fragment: 'length(substr([::alias::].name, 0, ?))'`,
  );
  expect(() => serialize(e)).toThrow(`Trying to serialize raw SQL fragment: 'length(substr([::alias::].name, 0, ?))'`);
});

test('validation or mixed order by', async () => {
  const key = raw(`length(substr(name, 0, 3))`);
  await expect(orm.em.findAll(User, { orderBy: { [key]: 'ASC', name: 'ASC' } })).rejects
    .toThrow(`Invalid "orderBy": You are mixing field-based keys and raw SQL fragments inside a single object.
This is not allowed because object key order cannot reliably preserve evaluation order.
To fix this, split them into separate objects inside an array:

orderBy: [ { name: 'ASC' }, { [raw('length(substr(name, 0, 3))')]: 'ASC' } ]`);
  await expect(orm.em.findAll(User, { orderBy: [{ [key]: 'ASC' }, { name: 'ASC' }] })).resolves.not.toThrow();

  expect(() => orm.em.qb(User).orderBy({ [key]: 'ASC', name: 'ASC' }))
    .toThrow(`Invalid "orderBy": You are mixing field-based keys and raw SQL fragments inside a single object.
This is not allowed because object key order cannot reliably preserve evaluation order.
To fix this, split them into separate objects inside an array:

orderBy: [ { name: 'ASC' }, { [raw('length(substr(name, 0, 3))')]: 'ASC' } ]`);
  expect(() => orm.em.qb(User).orderBy([{ [key]: 'ASC' }, { name: 'ASC' }])).not.toThrow();
});
