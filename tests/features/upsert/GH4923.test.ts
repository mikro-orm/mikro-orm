import { Entity, IDatabaseDriver, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
class User {

  @PrimaryKey()
  foo!: number;

  @PrimaryKey()
  bar!: number;

  @Property({ defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt?: Date;

}

const options = {
  'sqlite': { dbName: ':memory:' },
  'better-sqlite': { dbName: ':memory:' },
  'mysql': { dbName: 'mikro_orm_upsert', port: 3308 },
  'mariadb': { dbName: 'mikro_orm_upsert', port: 3309 },
  'postgresql': { dbName: 'mikro_orm_upsert' },
};

describe.each(Object.keys(options))('GH #4923 [%s]',  type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [User],
      type,
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
    await orm.em.insert(User, { foo: 1, bar: 2 });
  });

  afterAll(() => orm.close());

  test('GH #4923 em.upsert()', async () => {
    const result = await orm.em.upsert(User, { foo: 1, bar: 2 });
    expect(result).toBeInstanceOf(User);
  });

  test('GH #4923 em.upsertMany()', async () => {
    const result = await orm.em.upsertMany(User, [
      { foo: 1, bar: 2 },
    ]);
    expect(result).toHaveLength(1);
  });

});
