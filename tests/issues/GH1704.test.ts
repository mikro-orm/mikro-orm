import { Entity, PrimaryKey, Property, OneToOne, MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

@Entity()
export class Profile {

  @PrimaryKey()
  id!: number;

  @OneToOne('User', 'profile')
  user: any;

}

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToOne(() => Profile)
  profile!: Profile;

}

describe('GH issue 1704', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      driver: SqliteDriver,
      entities: [User, Profile],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('loading cached entity with relations', async () => {
    const user = new User();
    user.id = 1;
    user.name = 'Foo';
    user.profile = new Profile();
    user.profile.id = 2;
    await orm.em.fork().persistAndFlush(user);

    const mock = mockLogger(orm, ['query']);

    const getAndFlush = async (expected: number) => {
      const em = orm.em.fork();
      await em.findOneOrFail(Profile, 2, { cache: 1000 });
      await em.findOneOrFail(User, 1);
      await em.flush();
      expect(mock.mock.calls).toHaveLength(expected);
    };

    await getAndFlush(2); // no cache hit
    await getAndFlush(3); // cache hit, so 2 previous + 1 new query
  });

});
