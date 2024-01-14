import { MikroORM, Entity, PrimaryKey, Property, raw, RawQueryFragment } from '@mikro-orm/sqlite';

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
});
