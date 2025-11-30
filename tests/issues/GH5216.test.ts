import { MikroORM } from '@mikro-orm/postgresql';

import {
  Embeddable,
  Embedded,
  Entity,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Embeddable()
class Profile {

  @Property()
  username: string;

  @Property()
  createdAt = new Date();

  constructor(username: string) {
    this.username = username;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Profile, { object: true })
  profile1!: Profile;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: `mikro_orm_embeddables_date_bug`,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

async function createUser() {
  const user1 = new User();
  user1.profile1 = new Profile('u2');

  await orm.em.persist(user1).flush();
  orm.em.clear();

  return user1;
}

test('persist and load', async () => {
  const  user = await createUser();
  const u = await orm.em.findOneOrFail(User, user.id);
  expect(u.profile1.createdAt).toEqual(user.profile1.createdAt);
});
