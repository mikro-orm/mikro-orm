import { MikroORM } from '@mikro-orm/core';
import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
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
    metadataProvider: ReflectMetadataProvider,
    entities: [Profile, User],
    driver: SqliteDriver,
    dbName: ':memory:',
  });
});

beforeEach(async () => {
  await orm.schema.refresh();
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
