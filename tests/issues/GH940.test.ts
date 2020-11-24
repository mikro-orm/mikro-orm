import { BigIntType, Collection, Entity, Logger, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @OneToMany('UserOrganization', 'user')
  organizations = new Collection<UserOrganization>(this);

}

@Entity()
class UserOrganization {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @Property()
  isAdmin: boolean;

  constructor(user?: User, isAdmin = false) {
    this.user = user;
    this.isAdmin = isAdmin;
  }

}

describe('GH issue 940, 1117', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, UserOrganization],
      dbName: `:memory:`,
      type: 'sqlite',
    });
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => await orm.close(true));

  test('A boolean in the nested where conditions is kept even if the primary key is BigIntType', async () => {
    const user1 = new User();
    const user2 = new User();
    const user1org = new UserOrganization(user1, true);
    const user2org = new UserOrganization(user2, false);

    await orm.em.persistAndFlush([user1org, user2org]);

    const users = await orm.em.find(User, { organizations: { isAdmin: true } });
    expect(users).toMatchObject([
      {
        id: user1.id,
        organizations: {
          0: { id: user1org.id, isAdmin: true },
        },
      },
    ]);
  });

  test('bigint type is correctly diffed (null vs undefined) - GH #1117', async () => {
    const user1 = new User();
    const user2 = new User();
    const org1 = new UserOrganization(user1, true);
    const org2 = new UserOrganization(user2, false);
    const org3 = new UserOrganization();
    await orm.em.persistAndFlush([org1, org2, org3]);
    orm.em.clear();

    const orgs = await orm.em.find(UserOrganization, {});
    const mock = jest.fn();
    const logger = new Logger(mock, ['query', 'query-params']);
    Object.assign(orm.config, { logger });
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(0);
  });

});
