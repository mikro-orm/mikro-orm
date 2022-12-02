import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Embeddable()
export class Nested {

  @Property({ nullable: true })
  value: string | null = null;

}

@Embeddable()
export class Name {

  @Property({ nullable: true })
  value: string | null = null;

  @Embedded()
  nested!: Nested;

}

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Embedded()
  name!: Name;

}

describe('GH issue 2774', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Name, Nested],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('embeddable with only null values should be hydrated', async () => {
    let user = new User();
    user.name = new Name();
    user.name.nested = new Nested();
    await orm.em.persist(user).flush();

    user = await orm.em.fork().findOneOrFail(User, user);
    expect(user.name).toBeDefined();
    expect(user.name.value).toBeNull();
  });

});
