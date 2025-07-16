import {
  Collection,
  Entity,
  helper,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/postgresql';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => UserContact, userContact => userContact.user)
  contacts = new Collection<UserContact>(this);

}

@Entity()
class UserContact {

  @ManyToOne(() => User, { primary: true, ref: true })
  user!: Ref<User>;

  @ManyToOne(() => Contact, { primary: true, ref: true })
  contact!: Ref<Contact>;

}

@Entity()
class Contact {

  @PrimaryKey()
  id!: number;

  @Property()
  emails!: string[];

  @OneToMany(() => UserContact, userContact => userContact.contact)
  users = new Collection<UserContact>(this);

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6432',
    entities: [User],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6432', async () => {
  const user = orm.em.create(User, {
    contacts: [
      {
        contact: {
          emails: ['foo'],
        },
      },
    ],
  });
  await orm.em.flush();
  orm.em.clear();

  await orm.em.transactional(async tx => {
    const u = await tx.findOneOrFail(User, user.id, { populate: ['contacts.contact'] });
    expect(helper(u.contacts[0].contact).__originalEntityData).toEqual({ id: 1, emails: '{foo}' });

    orm.em.getUnitOfWork().computeChangeSets();
    expect(orm.em.getUnitOfWork().getChangeSets().length).toBe(0);
  });
});
