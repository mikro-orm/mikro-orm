import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class Country {

  @PrimaryKey()
  code!: string;

  @Property()
  name!: string;

  constructor(code: string, name: string) {
    this.code = code;
    this.name = name;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany(() => Country)
  countries = new Collection<Country>(this);

  constructor(name: string) {
    this.name = name;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('6031', async () => {
  orm.em.create(User, {
    name: 'Foo',
    countries: [new Country('US', 'United States')],
  });
  await orm.em.flush();
  orm.em.clear();

  const reloaded = await orm.em.findOneOrFail(User, { name: 'Foo' });

  expect(reloaded.countries.isInitialized()).toBe(false);
  const countries = await reloaded.countries.load({ dataloader: true });
  expect(countries).toHaveLength(1);
  expect(reloaded.countries.isInitialized()).toBe(true);
});
