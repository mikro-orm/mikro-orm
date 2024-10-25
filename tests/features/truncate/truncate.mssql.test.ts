import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mssql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

describe('truncate [mssql]', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: 'truncate',
      password: 'Root.Root',
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

    const [{ identity: identityBefore }] = await orm.em
      .execute(`SELECT IDENT_CURRENT('user') AS [identity]`);

    await orm.em.createQueryBuilder(User).truncate().execute();

    const [{ identity: identityAfter }] = await orm.em
      .execute(`SELECT IDENT_CURRENT('user') AS [identity]`);

    const users = await orm.em.find(User, {});

    expect(users.length).toBe(0);
    expect(identityBefore).toBe(3);
    expect(identityAfter).toBe(0);
  });

});
