import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

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
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: ':memory:',
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
  });

  afterAll(() => orm.close(true));

  test('truncates table', async () => {
    await orm.em
      .persist([
        orm.em.create(User, { name: 'u1' }),
        orm.em.create(User, { name: 'u2' }),
        orm.em.create(User, { name: 'u3' }),
      ])
      .flush();

    await orm.em.createQueryBuilder(User).truncate().execute();

    const users = await orm.em.find(User, {});

    expect(users.length).toBe(0);
  });
});
