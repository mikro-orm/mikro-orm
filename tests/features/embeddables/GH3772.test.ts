import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Embeddable()
export class Profile {

  @Property()
  username?: string;

}

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => Profile, { nullable: true })
  profile?: Profile | null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Profile, User],
    driver: SqliteDriver,
    dbName: ':memory:',
  });
});

beforeEach(async () => {
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('multi-insert entity with embedded property null', async () => {
  const user = orm.em.create(User, {
    name: 'Peter Pan',
    profile: null,
  });
  const user2 = orm.em.create(User, {
    name: 'Peter Pan 2',
    profile: null,
  });

  await orm.em.persist([user, user2]).flush();

  user.profile = { username: 'pan1' };
  user2.profile = { username: 'pan2' };
  await orm.em.flush();
});

test('multi-update entity with embedded property null', async () => {
  const user = orm.em.create(User, {
    name: 'Peter Pan',
    profile: { username: 'pan1' },
  });
  const user2 = orm.em.create(User, {
    name: 'Peter Pan 2',
    profile: { username: 'pan2' },
  });

  await orm.em.persist([user, user2]).flush();

  user.profile = null;
  user2.profile = null;
  await orm.em.flush();
});
