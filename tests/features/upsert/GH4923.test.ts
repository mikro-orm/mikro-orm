import { Entity, IDatabaseDriver, MikroORM, PrimaryKey, Property, Utils } from '@mikro-orm/core';
import { PLATFORMS } from '../../bootstrap';

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
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_upsert_4923', port: 3308 },
  mariadb: { dbName: 'mikro_orm_upsert_4923', port: 3309 },
  postgresql: { dbName: 'mikro_orm_upsert_4923' },
};

describe.each(Utils.keys(options))('GH #4923 [%s]',  type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [User],
      driver: PLATFORMS[type],
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
