import { MikroORM } from '@mikro-orm/sqlite';
import { Embeddable, Embedded, Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Organization {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property({ lazy: true })
  tag: string;

  constructor(name: string, tag: string) {
    this.name = name;
    this.tag = tag;
  }

}

@Embeddable()
class Properties {

  @ManyToOne({ entity: () => Organization })
  organization: Organization;

  constructor(organization: Organization) {
    this.organization = organization;
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

  @Embedded()
  properties: Properties;

  constructor(name: string, email: string, properties: Properties) {
    this.name = name;
    this.email = email;
    this.properties = properties;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [User, Properties, Organization],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #5956', async () => {
  const organization = orm.em.create(Organization, { name: 'Bar', tag: 'bar' });
  orm.em.create(User, { name: 'Foo', email: 'foo', properties: new Properties(organization) });
  await orm.em.flush();
  orm.em.clear();

  const user = await orm.em.fork().findOneOrFail(
    User,
    { email: 'foo' },
    { populate: ['properties.organization.tag'], strategy: 'joined' },
  );
  expect(user.properties.organization.tag).toBe('bar');

  const user2 = await orm.em.fork().findOneOrFail(
    User,
    { email: 'foo' },
    { populate: ['properties.organization.tag'], strategy: 'select-in' },
  );
  expect(user2.properties.organization.tag).toBe('bar');
});
