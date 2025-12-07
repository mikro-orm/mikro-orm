import { Embeddable, Embedded, Entity, ManyToOne, MikroORM, Opt, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Embeddable()
class Contact {

  @Property()
  firstName!: string;

  @Property()
  secondName!: string;

  @Property({ persist: false, getter: true, hydrate: false })
  get fullName(): string & Opt {
    return `${this.firstName} ${this.secondName}`;
  }

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Contact)
  contact!: Contact;

}

@Entity()
class Company {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  admin!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User, Company],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('virtual property in joined embeddable', async () => {
  const newUser = orm.em.create(User, { contact: { firstName: 'John', secondName: 'Doe' } });
  const newCompany = orm.em.create(Company, { admin: newUser });
  await orm.em.flush();
  orm.em.clear();

  const company = await orm.em.findOneOrFail(Company, { id: newCompany.id }, { populate: ['admin'] });
  expect(company.admin.contact.fullName).toBe('John Doe');
});
