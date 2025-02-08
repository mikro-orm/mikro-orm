import { Embeddable, Embedded, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

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

  @Embedded(() => Profile, { array: true })
  profiles: Profile[] = [];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('null value instead of object inside embedded property', async () => {
  const user = orm.em.create(User, {
    name: 'Peter Pan',
    profiles: [null as any],
  });
  await orm.em.insert(user);
  expect(user.id).toBeDefined();

  const u = await orm.em.fork().findOneOrFail(User, user);
  expect(JSON.stringify(u)).toBe('{"id":1,"name":"Peter Pan","profiles":[null]}');
});
