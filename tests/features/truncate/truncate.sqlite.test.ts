import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

describe('truncate [sqlite]', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: ':memory:',
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  afterAll(() => orm.close(true));

  test('truncates table', async () => {
    await orm.em.persistAndFlush([
      orm.em.create(User, { name: 'u1' }),
      orm.em.create(User, { name: 'u2' }),
      orm.em.create(User, { name: 'u3' }),
    ]);

    await orm.em.createQueryBuilder(User).truncate().execute();

    const users = await orm.em.find(User, {});

    expect(users.length).toBe(0);
  });

});
