import { MikroORM, raw, RawQueryFragment, wrap, serialize } from '@mikro-orm/sqlite';

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
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('#5129', async () => {
  const lengthOfTruncatedNameQuery = raw(
    alias => `length(substr(${alias}.name, 0, :maxLength))`,
    { maxLength: 3 },
  );

  await orm.em.find(
    User,
    { [lengthOfTruncatedNameQuery]: { $lte: 5 } },
    { orderBy: { [lengthOfTruncatedNameQuery]: 'ASC' } },
  );

  expect(RawQueryFragment.checkCacheSize()).toBe(0);
  expect(lengthOfTruncatedNameQuery.toJSON()).toBe('[raw]: length(substr([::alias::].name, 0, ?)) (#0)');

  const e = new User('n', 'e');
  e.name = lengthOfTruncatedNameQuery;
  expect(() => wrap(e).toObject()).toThrow(`Trying to serialize raw SQL fragment: 'length(substr([::alias::].name, 0, ?))'`);
  expect(() => JSON.stringify(e)).toThrow(`Trying to serialize raw SQL fragment: 'length(substr([::alias::].name, 0, ?))'`);
  expect(() => serialize(e)).toThrow(`Trying to serialize raw SQL fragment: 'length(substr([::alias::].name, 0, ?))'`);
});
