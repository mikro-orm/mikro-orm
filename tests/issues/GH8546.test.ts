import { Collection, MikroORM, ObjectId } from '@mikro-orm/mongodb';
import {
  Entity,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity()
class Role {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;
}

@Entity()
class User {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  email!: string;

  @ManyToMany({ entity: () => Role })
  roles = new Collection<Role>(this);
}

@Entity()
class Team {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @OneToMany({ entity: () => Member, mappedBy: 'team' })
  members = new Collection<Member>(this);
}

@Entity()
class Member {
  @PrimaryKey()
  _id!: ObjectId;

  @ManyToOne({ entity: () => Team })
  team!: Team;

  @Property()
  label!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, Role, Team, Member],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

beforeEach(async () => {
  await orm.schema.refresh();
});

test('GH #8546 - owning side: missing to-many field is an initialized empty collection', async () => {
  const id = new ObjectId();
  await orm.em.getConnection().getDb().collection('user').insertOne({ _id: id, email: 'test@example.com' });

  const em = orm.em.fork();
  const user = await em.findOneOrFail(User, id);

  expect(user.roles.isInitialized()).toBe(true);
  expect(user.roles.getItems()).toEqual([]);
  expect(user.roles).toHaveLength(0);
});

test('GH #8546 - inverse side: missing collection field stays uninitialized until populate', async () => {
  const em = orm.em.fork();
  const team = em.create(Team, {
    name: 'alpha',
    members: [{ label: 'one' }],
  });
  await em.flush();
  em.clear();

  const loaded = await em.findOneOrFail(Team, team.id);
  expect(loaded.members.isInitialized()).toBe(false);

  await em.populate(loaded, ['members']);
  expect(loaded.members).toHaveLength(1);
  expect(loaded.members.getItems()[0].label).toBe('one');
});
