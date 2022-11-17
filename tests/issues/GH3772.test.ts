import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => Profile, { nullable: true })
  profile?: Profile | null;

}

@Embeddable()
export class Profile {

  @Property()
  username?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Profile, User],
    type: 'better-sqlite',
    dbName: ':memory:',
  });
});

beforeEach(async () => {
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('insert entity with embedded property null', async () => {

  const user = orm.em.create(User, {
    name: 'Peter Pan',
    profile: null,
  });

  await orm.em.flush();
});


