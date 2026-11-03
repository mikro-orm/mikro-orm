import { Collection, PrimaryKeyProp, type Ref } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';


@Entity()
class User {
  [PrimaryKeyProp]?: 'UserID';

  @PrimaryKey({ fieldName: 'UserID' })
  UserID!: number;

  @Property()
  name!: string;
}

@Entity()
class Revision {
  [PrimaryKeyProp]?: 'RevisionID';

  @PrimaryKey({ fieldName: 'RevisionID' })
  RevisionID!: number;

  @OneToMany(() => Member, member => member.RevisionID)
  members = new Collection<Member>(this);
}

@Entity()
class Member {
  [PrimaryKeyProp]?: ['RevisionID', 'UserID', 'Type'];

  @ManyToOne(() => Revision, { primary: true, ref: true, fieldName: 'RevisionID' })
  RevisionID!: Ref<Revision>;

  @ManyToOne(() => User, { primary: true, ref: true, fieldName: 'UserID' })
  UserID!: Ref<User>;

  @PrimaryKey({ fieldName: 'Type' })
  Type!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User, Revision, Member],
    dbName: ':memory:',
  });
  await orm.schema.create();
  await orm.em.insertMany(User, [{ UserID: 1, name: 'John' }, { UserID: 2, name: 'Cindy' }]);
  await orm.em.insert(Revision, { RevisionID: 1 });
  await orm.em.insertMany(Member, [
    { RevisionID: 1, UserID: 1, Type: 'member' },
    { RevisionID: 1, UserID: 2, Type: 'chair' },
  ]);
});

afterAll(() => orm.close(true));

test.each(['joined', 'select-in', 'balanced'] as const)('nested populate of a composite PK relation (%s)', async strategy => {
  const revisions = await orm.em.fork().find(Revision, {}, {
    populate: ['members.UserID'],
    strategy,
  });
  expect(revisions).toHaveLength(1);
  expect(revisions[0].members.getItems().map(member => member.UserID.$.name).sort()).toEqual(['Cindy', 'John']);
});
