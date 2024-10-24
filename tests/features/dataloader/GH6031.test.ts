import {
  Collection,
  Entity,
  ManyToMany,
  MikroORM,
  PrimaryKey,
  Property,
} from '@mikro-orm/sqlite';

@Entity()
export class Country {

  @PrimaryKey()
  code!: string;

  @Property()
  name!: string;

  // @ManyToMany(() => User, u => u.countries)
  // users = new Collection<User>(this);

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

test('GH #6031', async () => {
  orm.em.create(User, {
    name: 'Foo',
    countries: [new Country('US', 'United States')],
  });
  await orm.em.flush();
  orm.em.clear();

  const reloaded = await orm.em.findOneOrFail(User, { name: 'Foo' });
  expect(reloaded.countries.isInitialized()).toBe(false);

  // FIXME https://github.com/mikro-orm/mikro-orm/issues/6031
  // await reloaded.countries.load({ dataloader: true });
  // expect(reloaded.countries).toHaveLength(1);
  // expect(reloaded.countries[0].code).toBe('US');

  await expect(reloaded.countries.load({ dataloader: true })).rejects.toThrow('Inverse side is required for M:N relations with dataloader: User.countries');
});
