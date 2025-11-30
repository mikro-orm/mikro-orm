import { MikroORM } from '@mikro-orm/sqlite';

import { Embeddable, Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Embeddable()
class Nested {

  @Property({ nullable: true })
  value: string | null = null;

}

@Embeddable()
class Name {

  @Property({ nullable: true })
  value: string | null = null;

  @Embedded()
  nested!: Nested;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Embedded()
  name!: Name;

}

describe('GH issue 2774', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Name, Nested],
      dbName: ':memory:',
    });
    await orm.schema.create();
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
