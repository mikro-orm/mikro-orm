import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ persist: false })
  get lowerName(): string {
    return this.name.toLowerCase();
  }

  @Property({ persist: true })
  get upperName(): string {
    return this.name.toUpperCase();
  }

}

describe('GH issue 2760', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('virtual getter property that should get persisted', async () => {
    let user = new User();
    user.name = 'Abc';
    await orm.em.persist(user).flush();

    user = await orm.em.fork().findOneOrFail(User, user);
    expect(user.lowerName).toBe('abc');
    expect(user.upperName).toBe('ABC');
  });

});
