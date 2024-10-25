import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mysql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

describe('truncate [mysql]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: 'truncate',
      port: 3308,
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.schema.clearDatabase();
  });

  afterAll(() => orm.close(true));

  test('truncates table and resets identity value', async () => {
    await orm.em.persistAndFlush([
      orm.em.create(User, { name: 'u1' }),
      orm.em.create(User, { name: 'u2' }),
      orm.em.create(User, { name: 'u3' }),
    ]);

    const usersBefore = await orm.em.find(User, {});

    await orm.em.createQueryBuilder(User).truncate().execute();

    const usersAfter = await orm.em.find(User, {});

    const newUser = orm.em.create(User, { name: 'new_u1' });
    await orm.em.persist(newUser).flush();

    expect(usersBefore.at(-1)!.id).toBe(3);
    expect(usersAfter.length).toBe(0);
    expect(newUser.id).toBe(1);
  });

});
