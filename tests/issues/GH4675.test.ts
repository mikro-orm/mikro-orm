import { LoadStrategy, OptionalProps, Ref } from '@mikro-orm/core';
import { Entity, ManyToOne, OneToOne, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  username!: string;

  @OneToOne({ entity: () => Profile, mappedBy: (profile: Profile) => profile.user, nullable: true })
  profile!: Ref<Profile> | null;

  [OptionalProps]?: 'profile';

}

@Entity()
export class Profile {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => User, inversedBy: user => user.profile, owner: true, hidden: true })
  user!: User;

  @Property()
  name!: string;

}

@Entity()
export class Session {

  @PrimaryKey()
  id!: number;

  @Property()
  token!: string;

  @ManyToOne({ entity: () => User })
  user!: User;

}

let orm: MikroORM;

test('GH #4675', async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Session],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const user = await orm.em.insert(User, { username: 'username' });
  await orm.em.insert(Session, { token: 'abc123', user });

  const session1 = await orm.em.findOneOrFail(Session, { token: 'abc123' }, {
    populate: ['user', 'user.profile'],
    strategy: LoadStrategy.SELECT_IN,
    disableIdentityMap: true,
  });
  expect(session1.user.profile).toBeNull();

  const session2 = await orm.em.findOneOrFail(Session, { token: 'abc123' }, {
    populate: ['user', 'user.profile'],
    strategy: LoadStrategy.JOINED,
    disableIdentityMap: true,
  });
  expect(session2.user.profile).toBeNull();

  await orm.close();
});

test('GH #4675 (forceUndefined: true)', async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Session],
    dbName: ':memory:',
    forceUndefined: true,
  });
  await orm.schema.create();

  const user = await orm.em.insert(User, { username: 'username' });
  await orm.em.insert(Session, { token: 'abc123', user });

  const session1 = await orm.em.findOneOrFail(Session, { token: 'abc123' }, {
    populate: ['user', 'user.profile'],
    strategy: LoadStrategy.SELECT_IN,
    disableIdentityMap: true,
  });
  expect(session1.user.profile).toBeUndefined();

  const session2 = await orm.em.findOneOrFail(Session, { token: 'abc123' }, {
    populate: ['user', 'user.profile'],
    strategy: LoadStrategy.JOINED,
    disableIdentityMap: true,
  });
  expect(session2.user.profile).toBeUndefined();

  await orm.close();
});
