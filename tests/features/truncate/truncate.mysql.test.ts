import { MikroORM } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: 'truncate',
      port: 3308,
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
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
