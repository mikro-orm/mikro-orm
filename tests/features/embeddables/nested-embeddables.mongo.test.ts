import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { ObjectId, MongoConnection } from '@mikro-orm/mongodb';
import { mockLogger } from '../../helpers';

@Embeddable()
class IdentityMeta {

  @Property()
  foo?: string;

  @Property()
  bar?: string;

  constructor(foo?: string, bar?: string) {
    this.foo = foo;
    this.bar = bar;
  }

}

@Embeddable()
class Identity {

  @Property()
  email: string;

  @Embedded(() => IdentityMeta, { nullable: true })
  meta?: IdentityMeta;

  constructor(email: string, meta?: IdentityMeta) {
    this.email = email;
    this.meta = meta;
  }

}

@Embeddable()
class Profile {

  @Property()
  username: string;

  @Embedded(() => Identity)
  identity: Identity;

  constructor(username: string, identity: Identity) {
    this.username = username;
    this.identity = identity;
  }

}

@Entity()
class User {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name!: string;

  @Embedded(() => Profile)
  profile1!: Profile;

  @Embedded(() => Profile, { object: true })
  profile2!: Profile;

}

describe('embedded entities in mongo', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Profile, Identity, IdentityMeta],
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test-nested-embeddables?replicaSet=rs',
      type: 'mongo',
    });
  });

  afterAll(async () => {
    await orm.em.getDriver().dropCollections();
    await orm.close(true);
  });

  test('create collections', async () => {
    const createCollection = jest.spyOn(MongoConnection.prototype, 'createCollection');
    createCollection.mockResolvedValue({} as any);
    await orm.em.getDriver().createCollections();
    expect(createCollection.mock.calls.map(c => c[0])).toEqual(['user']);
    createCollection.mockRestore();
  });

  test('diffing', async () => {
    expect(orm.em.getComparator().getSnapshotGenerator('User').toString()).toMatchSnapshot();
  });

  test('persist and load', async () => {
    const user1 = new User();
    user1.name = 'Uwe';
    user1.profile1 = new Profile('u1', new Identity('e1', new IdentityMeta('f1', 'b1')));
    user1.profile2 = new Profile('u2', new Identity('e2', new IdentityMeta('f2', 'b2')));

    const user2 = new User();
    user2.name = 'Uschi';
    user2.profile1 = new Profile('u3', new Identity('e3'));
    user2.profile2 = new Profile('u4', new Identity('e4', new IdentityMeta('f4')));

    const mock = mockLogger(orm);
    await orm.em.persistAndFlush([user1, user2]);
    orm.em.clear();
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('user').insertMany([ { name: 'Uwe', profile1_username: 'u1', profile1_identity_email: 'e1', profile1_identity_meta_foo: 'f1', profile1_identity_meta_bar: 'b1', profile2: { username: 'u2', identity: { email: 'e2', meta: { foo: 'f2', bar: 'b2' } } } }, { name: 'Uschi', profile1_username: 'u3', profile1_identity_email: 'e3', profile2: { username: 'u4', identity: { email: 'e4', meta: { foo: 'f4' } } } } ], { session: undefined });`);

    const u1 = await orm.em.findOneOrFail(User, user1._id);
    const u2 = await orm.em.findOneOrFail(User, user2._id);
    expect(mock.mock.calls[1][0]).toMatch(/db\.getCollection\('user'\)\.find\({ _id: .* }, { session: undefined }\)\.limit\(1\).toArray\(\);/);
    expect(u1.profile1).toBeInstanceOf(Profile);
    expect(u1.profile1).toEqual({
      username: 'u1',
      identity: {
        email: 'e1',
        meta: {
          bar: 'b1',
          foo: 'f1',
        },
      },
    });
    expect(u1.profile2).toBeInstanceOf(Profile);
    expect(u1.profile2).toEqual({
      username: 'u2',
      identity: {
        email: 'e2',
        meta: {
          bar: 'b2',
          foo: 'f2',
        },
      },
    });
    expect(u2.profile1).toBeInstanceOf(Profile);
    expect(u2.profile1).toEqual({
      username: 'u3',
      identity: {
        email: 'e3',
      },
    });
    expect(u2.profile2).toBeInstanceOf(Profile);
    expect(u2.profile2).toEqual({
      username: 'u4',
      identity: {
        email: 'e4',
        meta: {
          foo: 'f4',
        },
      },
    });

    expect(mock.mock.calls.length).toBe(3);
    await orm.em.flush();
    expect(mock.mock.calls.length).toBe(3);

    u1.profile1!.identity.email = 'e123';
    u1.profile1!.identity.meta!.foo = 'foooooooo';
    u1.profile2!.identity.meta!.bar = 'bababar';
    await orm.em.flush();
    expect(mock.mock.calls[3][0]).toMatch(/db\.getCollection\('user'\)\.updateMany\({ _id: .* }, { '\$set': { profile1_identity_email: 'e123', profile1_identity_meta_foo: 'foooooooo', profile2: { username: 'u2', identity: { email: 'e2', meta: { foo: 'f2', bar: 'bababar' } } } } }, { session: undefined }\);/);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u3 = await orm.em.findOneOrFail(User, {
      profile1: { identity: { email: 'e123', meta: { foo: 'foooooooo' } } },
      profile2: { identity: { email: 'e2', meta: { foo: 'f2', bar: 'bababar' } } },
    });
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('user'\)\.find\({ profile1_identity_email: 'e123', profile1_identity_meta_foo: 'foooooooo', 'profile2\.identity\.email': 'e2', 'profile2\.identity\.meta\.foo': 'f2', 'profile2\.identity\.meta\.bar': 'bababar' }, { session: undefined }\)\.limit\(1\).toArray\(\);/);
    expect(u3._id).toEqual(u1._id);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u4 = await orm.em.findOneOrFail(User, {
      profile1: { identity: { email: 'e123', meta: { foo: /fo+/ } } },
      profile2: { identity: { email: 'e2', meta: { foo: 'f2', bar: /(ba)+r/ } } },
    });
    expect(u4._id).toEqual(u1._id);
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('user'\)\.find\({ profile1_identity_email: 'e123', profile1_identity_meta_foo: \/fo\+\/, 'profile2\.identity\.email': 'e2', 'profile2\.identity\.meta\.foo': 'f2', 'profile2\.identity\.meta\.bar': \/\(ba\)\+r\/ }, { session: undefined }\)\.limit\(1\).toArray\(\);/);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u5 = await orm.em.findOneOrFail(User, { $or: [{ profile1: { identity: { meta: { foo: 'foooooooo' } } } }, { profile2: { identity: { meta: { bar: 'bababar' } } } }] });
    expect(mock.mock.calls[0][0]).toMatch(/db\.getCollection\('user'\)\.find\({ '\$or': \[ { profile1_identity_meta_foo: 'foooooooo' }, { 'profile2\.identity\.meta\.bar': 'bababar' } ] }, { session: undefined }\)\.limit\(1\).toArray\(\);/);
    expect(u5._id).toEqual(u1._id);

    const err1 = `Invalid query for entity 'User', property 'city' does not exist in embeddable 'Identity'`;
    await expect(orm.em.findOneOrFail(User, { profile1: { identity: { city: 'London 1' } as any } })).rejects.toThrowError(err1);

    const err2 = `Invalid query for entity 'User', property 'city' does not exist in embeddable 'Identity'`;
    await expect(orm.em.findOneOrFail(User, { profile2: { identity: { city: 'London 1' } as any } })).rejects.toThrowError(err2);
  });

  test('#assign() works with nested embeddables', async () => {
    const jon = new User();

    orm.em.assign(jon, {
      profile1: { username: 'u1', identity: { email: 'e1', meta: { bar: 'b1', foo: 'f1' } } },
      profile2: { username: 'u2', identity: { email: 'e2', meta: { bar: 'b2', foo: 'f2' } } },
    });
    expect(jon.profile1).toMatchObject({ username: 'u1', identity: { email: 'e1', meta: { bar: 'b1', foo: 'f1' } } });
    expect(jon.profile1).toBeInstanceOf(Profile);
    expect(jon.profile1.identity).toBeInstanceOf(Identity);
    expect(jon.profile1.identity.meta).toBeInstanceOf(IdentityMeta);
    expect(jon.profile2).toMatchObject({ username: 'u2', identity: { email: 'e2', meta: { bar: 'b2', foo: 'f2' } } });
    expect(jon.profile2).toBeInstanceOf(Profile);
    expect(jon.profile2.identity).toBeInstanceOf(Identity);
    expect(jon.profile2.identity.meta).toBeInstanceOf(IdentityMeta);

    orm.em.assign(jon, { profile1: { identity: { email: 'e3' } } });
    expect(jon.profile1.username).toBe('u1');
    expect(jon.profile1.identity.email).toBe('e3');
    expect(jon.profile1.identity.meta).not.toBeUndefined();
    delete jon.profile1.identity.meta;

    orm.em.assign(jon, { profile1: { identity: { meta: { foo: 'f' } } } });
    expect(jon.profile1.identity.meta!.foo).toBe('f');
    expect(jon.profile1.identity.meta).toBeInstanceOf(IdentityMeta);

    orm.em.assign(jon, { profile1: { identity: { email: 'e4' } } }, { mergeObjects: false });
    expect(jon.profile1.username).toBeUndefined();
    expect(jon.profile1.identity.email).toBe('e4');
    expect(jon.profile1.identity.meta).toBeUndefined();
  });

});
