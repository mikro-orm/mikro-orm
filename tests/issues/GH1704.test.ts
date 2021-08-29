import { Entity, PrimaryKey, Property, OneToOne, MikroORM, Logger } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

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
      type: 'sqlite',
      entities: [User, Profile],
      dbName: ':memory:',
    });
    await orm.getSchemaGenerator().createSchema();
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

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

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
