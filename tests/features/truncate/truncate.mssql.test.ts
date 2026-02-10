import { MikroORM } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: 'truncate',
      password: 'Root.Root',
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  afterAll(() => orm.close(true));

  test('truncates table and resets identity value', async () => {
    await orm.em
      .persist([
        orm.em.create(User, { name: 'u1' }),
        orm.em.create(User, { name: 'u2' }),
        orm.em.create(User, { name: 'u3' }),
      ])
      .flush();

    const [{ identity: identityBefore }] = await orm.em.execute(`SELECT IDENT_CURRENT('user') AS [identity]`);

    await orm.em.createQueryBuilder(User).truncate().execute();

    const [{ identity: identityAfter }] = await orm.em.execute(`SELECT IDENT_CURRENT('user') AS [identity]`);

    const users = await orm.em.find(User, {});

    expect(users.length).toBe(0);
    expect(identityBefore).toBe(3);
    expect(identityAfter).toBe(0);
  });
});
