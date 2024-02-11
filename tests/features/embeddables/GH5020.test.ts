import { Embeddable, Embedded, Entity, ManyToOne, MikroORM, PrimaryKey, Property, Ref, types } from '@mikro-orm/sqlite';

@Embeddable()
class Settings {

  @Property({ type: types.string })
  name!: string;

  @Property({ type: types.double })
  memberCount!: number;

  @Property({ type: types.boolean })
  isActive!: boolean;

  constructor(name: string, memberCount: number, isActive: boolean) {
    this.name = name;
    this.memberCount = memberCount;
    this.isActive = isActive;
  }

}

@Entity()
class Organization {

  @PrimaryKey()
  id!: number;

  @Embedded({ entity: () => Settings, object: true })
  settings!: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  @ManyToOne({ entity: () => Organization, ref: true })
  organization!: Ref<Organization>;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.createSchema();

  orm.em.create(User, {
    name: 'Foo',
    email: 'foo',
    organization: orm.em.create(Organization, {
      settings: new Settings('Bar', 9000, false),
    }),
  });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('joined strategy and object embeddables with not matching field names', async () => {
  const user = await orm.em.findOneOrFail(
    User,
    { email: 'foo' },
    { populate: ['organization'] },
  );
  const relatedOrganization = user.organization.getEntity();
  expect(user.name).toBe('Foo');
  expect(relatedOrganization.settings.name).toBe('Bar');
  expect(relatedOrganization.settings.memberCount).toBe(9000); // This fails
  expect(relatedOrganization.settings.isActive).toBe(false); // This fails too
});

test('simple find and object embeddables with not matching field names', async () => {
  const organization = await orm.em.findOneOrFail(Organization, {
    id: 1,
  });
  expect(organization.settings.name).toBe('Bar');
  expect(organization.settings.memberCount).toBe(9000);
  expect(organization.settings.isActive).toBe(false);
});
