import type { ObjectHydrator } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, ManyToOne, MikroORM, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { ObjectId } from '@mikro-orm/mongodb';
import { mockLogger } from '../../helpers';

@Entity()
class Source {

  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Embeddable()
class IdentityMeta {

  @Property()
  foo?: string;

  @Property()
  bar?: string;

  @ManyToOne(() => Source, { nullable: true })
  source?: Source;

  constructor(foo?: string, bar?: string) {
    this.foo = foo;
    this.bar = bar;
  }

}

@Embeddable()
class IdentityLink {

  @Property({ nullable: true })
  url?: string;

  @Property({ nullable: true })
  createdAt?: Date;

  @Embedded(() => IdentityMeta)
  meta?: IdentityMeta;

  @Embedded(() => IdentityMeta, { array: true })
  metas: IdentityMeta[] = [];

  @ManyToOne(() => Source, { nullable: true })
  source?: Source;

  constructor(url: string) {
    this.url = url;
    this.meta = new IdentityMeta('f1', 'b1');
    this.metas.push(new IdentityMeta('f2', 'b2'));
    this.metas.push(new IdentityMeta('f3', 'b3'));
    this.metas.push(new IdentityMeta('f4', 'b4'));
  }

}

@Embeddable()
class Identity {

  @Property()
  email: string;

  @Embedded(() => IdentityMeta, { nullable: true })
  meta?: IdentityMeta;

  @Embedded(() => IdentityLink, { array: true })
  links: IdentityLink[] = [];

  @ManyToOne(() => Source, { nullable: true })
  source?: Source;

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

  @ManyToOne(() => Source, { nullable: true })
  source?: Source;

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
      entities: [User, Profile, Identity, IdentityMeta, IdentityLink, Source],
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test-entities-in-embeddables?replicaSet=rs',
      type: 'mongo',
    });
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(User, {});
    await orm.em.nativeDelete(Source, {});
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('diffing', async () => {
    expect(orm.em.getComparator().getSnapshotGenerator('User').toString()).toMatchSnapshot();
    const metadata = orm.getMetadata();
    const hydrator = orm.config.getHydrator(metadata) as ObjectHydrator;
    expect(hydrator.getEntityHydrator(metadata.get('User'), 'full').toString()).toMatchSnapshot();
  });

  async function createUsers() {
    const user1 = orm.em.create(User, {
      _id: new ObjectId('600000000000000000000001'),
      name: 'Uwe',
      profile1: {
        username: 'u1',
        identity: {
          email: 'e1',
          meta: {
            foo: 'f1',
            bar: 'b1',
            source: { _id: new ObjectId('600000000000000000000002'), name: 'ims1' },
          },
          source: { _id: new ObjectId('600000000000000000000003'), name: 'is1' },
          links: [],
        },
        source: { _id: new ObjectId('600000000000000000000004'), name: 's1' },
      },
      profile2: {
        username: 'u2',
        identity: {
          email: 'e2',
          meta: {
            foo: 'f2',
            bar: 'b2',
            source: { _id: new ObjectId('600000000000000000000005'), name: 'ims2' },
          },
          source: { _id: new ObjectId('600000000000000000000006'), name: 'is2' },
          links: [],
        },
        source: { _id: new ObjectId('600000000000000000000007'), name: 's2' },
      },
    });

    const user2 = new User();
    user2._id = new ObjectId('600000000000000000000011');
    user2.name = 'Uschi';
    user2.profile1 = new Profile('u3', new Identity('e3'));
    user2.profile1.source = new Source('s3');
    user2.profile1.source._id = new ObjectId('600000000000000000000012');
    user2.profile1.identity.links.push(new IdentityLink('l1'), new IdentityLink('l2'));
    user2.profile1.identity.source = new Source('is3');
    user2.profile1.identity.source._id = new ObjectId('600000000000000000000013');
    user2.profile1.identity.links[0].source = new Source('ils31');
    user2.profile1.identity.links[0].source._id = new ObjectId('600000000000000000000014');
    user2.profile1.identity.links[1].source = new Source('ils32');
    user2.profile1.identity.links[1].source._id = new ObjectId('600000000000000000000015');
    user2.profile1.identity.links[0].metas[0].source = new Source('ilms311');
    user2.profile1.identity.links[0].metas[0].source._id = new ObjectId('600000000000000000000016');
    user2.profile1.identity.links[0].metas[1].source = new Source('ilms312');
    user2.profile1.identity.links[0].metas[1].source._id = new ObjectId('600000000000000000000017');
    user2.profile1.identity.links[0].metas[2].source = new Source('ilms313');
    user2.profile1.identity.links[0].metas[2].source._id = new ObjectId('600000000000000000000018');
    user2.profile1.identity.links[1].metas[0].source = new Source('ilms321');
    user2.profile1.identity.links[1].metas[0].source._id = new ObjectId('600000000000000000000019');
    user2.profile1.identity.links[1].metas[1].source = new Source('ilms322');
    user2.profile1.identity.links[1].metas[1].source._id = new ObjectId('60000000000000000000001a');
    user2.profile1.identity.links[1].metas[2].source = new Source('ilms323');
    user2.profile1.identity.links[1].metas[2].source._id = new ObjectId('60000000000000000000001b');
    user2.profile2 = new Profile('u4', new Identity('e4', new IdentityMeta('f4')));
    user2.profile2.source = new Source('s4');
    user2.profile2.source._id = new ObjectId('60000000000000000000001c');
    user2.profile2.identity.links.push(new IdentityLink('l3'), new IdentityLink('l4'));
    user2.profile2.identity.source = new Source('is4');
    user2.profile2.identity.source._id = new ObjectId('60000000000000000000001d');
    user2.profile2.identity.links[0].source = new Source('ils41');
    user2.profile2.identity.links[0].source._id = new ObjectId('60000000000000000000001e');
    user2.profile2.identity.links[1].source = new Source('ils42');
    user2.profile2.identity.links[1].source._id = new ObjectId('60000000000000000000001f');

    await orm.em.persistAndFlush([user1, user2]);
    orm.em.clear();

    return { user1, user2 };
  }

  test('persist and load', async () => {
    const mock = mockLogger(orm);
    const { user1, user2 } = await createUsers();
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('source').insertMany([ { _id: ObjectId('600000000000000000000004'), name: 's1' }, { _id: ObjectId('600000000000000000000003'), name: 'is1' }, { _id: ObjectId('600000000000000000000002'), name: 'ims1' }, { _id: ObjectId('600000000000000000000007'), name: 's2' }, { _id: ObjectId('600000000000000000000006'), name: 'is2' }, { _id: ObjectId('600000000000000000000005'), name: 'ims2' }, { _id: ObjectId('600000000000000000000012'), name: 's3' }, { _id: ObjectId('600000000000000000000013'), name: 'is3' }, { _id: ObjectId('600000000000000000000014'), name: 'ils31' }, { _id: ObjectId('600000000000000000000015'), name: 'ils32' }, { _id: ObjectId('600000000000000000000016'), name: 'ilms311' }, { _id: ObjectId('600000000000000000000017'), name: 'ilms312' }, { _id: ObjectId('600000000000000000000018'), name: 'ilms313' }, { _id: ObjectId('600000000000000000000019'), name: 'ilms321' }, { _id: ObjectId('60000000000000000000001a'), name: 'ilms322' }, { _id: ObjectId('60000000000000000000001b'), name: 'ilms323' }, { _id: ObjectId('60000000000000000000001c'), name: 's4' }, { _id: ObjectId('60000000000000000000001d'), name: 'is4' }, { _id: ObjectId('60000000000000000000001e'), name: 'ils41' }, { _id: ObjectId('60000000000000000000001f'), name: 'ils42' } ], { session: undefined });`);
    expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('user').insertMany([ { _id: ObjectId('600000000000000000000001'), name: 'Uwe', profile1_username: 'u1', profile1_identity_email: 'e1', profile1_identity_meta_foo: 'f1', profile1_identity_meta_bar: 'b1', profile1_identity_meta_source: ObjectId('600000000000000000000002'), profile1_identity_links: [], profile1_identity_source: ObjectId('600000000000000000000003'), profile1_source: ObjectId('600000000000000000000004'), profile2: { username: 'u2', identity: { email: 'e2', meta: { foo: 'f2', bar: 'b2', source: ObjectId('600000000000000000000005') }, links: [], source: ObjectId('600000000000000000000006') }, source: ObjectId('600000000000000000000007') } }, { _id: ObjectId('600000000000000000000011'), name: 'Uschi', profile1_username: 'u3', profile1_identity_email: 'e3', profile1_identity_links: [ { url: 'l1', meta: { foo: 'f1', bar: 'b1' }, metas: [ { foo: 'f2', bar: 'b2', source: ObjectId('600000000000000000000016') }, { foo: 'f3', bar: 'b3', source: ObjectId('600000000000000000000017') }, { foo: 'f4', bar: 'b4', source: ObjectId('600000000000000000000018') } ], source: ObjectId('600000000000000000000014') }, { url: 'l2', meta: { foo: 'f1', bar: 'b1' }, metas: [ { foo: 'f2', bar: 'b2', source: ObjectId('600000000000000000000019') }, { foo: 'f3', bar: 'b3', source: ObjectId('60000000000000000000001a') }, { foo: 'f4', bar: 'b4', source: ObjectId('60000000000000000000001b') } ], source: ObjectId('600000000000000000000015') } ], profile1_identity_source: ObjectId('600000000000000000000013'), profile1_source: ObjectId('600000000000000000000012'), profile2: { username: 'u4', identity: { email: 'e4', meta: { foo: 'f4' }, links: [ { url: 'l3', meta: [Object], metas: [Array], source: ObjectId('60000000000000000000001e') }, { url: 'l4', meta: [Object], metas: [Array], source: ObjectId('60000000000000000000001f') } ], source: ObjectId('60000000000000000000001d') }, source: ObjectId('60000000000000000000001c') } } ], { session: undefined });`);

    const u1 = await orm.em.findOneOrFail(User, user1._id);
    const u2 = await orm.em.findOneOrFail(User, user2._id);

    expect(mock.mock.calls[2][0]).toMatch(`db.getCollection('user').find({ _id: ObjectId('600000000000000000000001') }, { session: undefined }).limit(1).toArray();`);
    expect(mock.mock.calls[3][0]).toMatch(`db.getCollection('user').find({ _id: ObjectId('600000000000000000000011') }, { session: undefined }).limit(1).toArray();`);
    expect(u1.profile1).toBeInstanceOf(Profile);
    expect(u1.profile1.identity).toBeInstanceOf(Identity);
    expect(u1.profile1.identity.meta).toBeInstanceOf(IdentityMeta);
    expect(u1.profile1.source).toBeInstanceOf(Source);
    expect(u1.profile1.identity.source).toBeInstanceOf(Source);
    expect(wrap(u1.profile1.identity.source).isInitialized()).toBe(false);
    expect(u1.profile1).toMatchObject({
      username: 'u1',
      identity: {
        email: 'e1',
        links: [],
        meta: {
          bar: 'b1',
          foo: 'f1',
          source: { id: u1.profile1.identity.meta!.source!._id.toHexString() },
        },
      },
      source: { id: u1.profile1.source!._id.toHexString() },
    });
    expect(u1.profile2).toBeInstanceOf(Profile);
    expect(u1.profile2.identity).toBeInstanceOf(Identity);
    expect(u1.profile2.source).toBeInstanceOf(Source);
    expect(u1.profile2.identity.meta).toBeInstanceOf(IdentityMeta);
    expect(u1.profile2.identity.source).toBeInstanceOf(Source);
    expect(u1.profile2).toMatchObject({
      username: 'u2',
      identity: {
        email: 'e2',
        links: [],
        meta: {
          bar: 'b2',
          foo: 'f2',
          source: { id: u1.profile2.identity.meta!.source!._id.toHexString() },
        },
        source: { id: u1.profile2.identity.source!._id.toHexString() },
      },
      source: { id: u1.profile2.source!._id.toHexString() },
    });
    expect(u2.profile1).toBeInstanceOf(Profile);
    expect(u2.profile1.identity).toBeInstanceOf(Identity);
    expect(u2.profile1.identity.links[0]).toBeInstanceOf(IdentityLink);
    expect(u2.profile1.source).toBeInstanceOf(Source);
    expect(u2.profile1.identity.source).toBeInstanceOf(Source);
    expect(u2.profile1.identity.links[0].source).toBeInstanceOf(Source);
    expect(u2.profile1.identity.links[1].source).toBeInstanceOf(Source);
    expect(u2.profile1.identity.links[1].metas[0].source).toBeInstanceOf(Source);
    expect(u2.profile1).toMatchObject({
      username: 'u3',
      identity: {
        email: 'e3',
        links: [
          { url: 'l1', meta: { bar: 'b1', foo: 'f1' }, source: { id: u2.profile1.identity.links[0].source!._id.toHexString() }, metas: [
            { bar: 'b2', foo: 'f2', source: { id: u2.profile1.identity.links[0].metas[0].source!._id.toHexString() } },
            { bar: 'b3', foo: 'f3', source: { id: u2.profile1.identity.links[0].metas[1].source!._id.toHexString() } },
            { bar: 'b4', foo: 'f4', source: { id: u2.profile1.identity.links[0].metas[2].source!._id.toHexString() } },
          ] },
          { url: 'l2', meta: { bar: 'b1', foo: 'f1' }, source: { id: u2.profile1.identity.links[1].source!._id.toHexString() }, metas: [
            { bar: 'b2', foo: 'f2', source: { id: u2.profile1.identity.links[1].metas[0].source!._id.toHexString() } },
            { bar: 'b3', foo: 'f3', source: { id: u2.profile1.identity.links[1].metas[1].source!._id.toHexString() } },
            { bar: 'b4', foo: 'f4', source: { id: u2.profile1.identity.links[1].metas[2].source!._id.toHexString() } },
          ] },
        ],
        source: { id: u2.profile1.identity.source!._id.toHexString() },
      },
      source: { id: u2.profile1.source!._id.toHexString() },
    });
    expect(u2.profile2).toBeInstanceOf(Profile);
    expect(u2.profile2.identity).toBeInstanceOf(Identity);
    expect(u2.profile2.identity.links[0]).toBeInstanceOf(IdentityLink);
    expect(u2.profile2.identity.meta).toBeInstanceOf(IdentityMeta);
    expect(u2.profile2.source).toBeInstanceOf(Source);
    expect(u2.profile2.identity.source).toBeInstanceOf(Source);
    expect(u2.profile2.identity.links[0].source).toBeInstanceOf(Source);
    expect(u2.profile2.identity.links[1].source).toBeInstanceOf(Source);
    expect(u2.profile2).toMatchObject({
      username: 'u4',
      identity: {
        email: 'e4',
        links: [
          { url: 'l3', meta: { bar: 'b1', foo: 'f1' }, source: { id: u2.profile2.identity.links[0].source!._id.toHexString() }, metas: [
              { bar: 'b2', foo: 'f2' },
              { bar: 'b3', foo: 'f3' },
              { bar: 'b4', foo: 'f4' },
            ] },
          { url: 'l4', meta: { bar: 'b1', foo: 'f1' }, source: { id: u2.profile2.identity.links[1].source!._id.toHexString() }, metas: [
              { bar: 'b2', foo: 'f2' },
              { bar: 'b3', foo: 'f3' },
              { bar: 'b4', foo: 'f4' },
            ] },
        ],
        meta: {
          foo: 'f4',
        },
        source: { id: u2.profile2.identity.source!._id.toHexString() },
      },
      source: { id: u2.profile2.source!._id.toHexString() },
    });

    mock.mock.calls.length = 0;
    expect(mock.mock.calls.length).toBe(0);
    await orm.em.flush();
    expect(mock.mock.calls.length).toBe(0);

    u1.profile1!.identity.email = 'e123';
    u1.profile1!.identity.meta!.foo = 'foooooooo';
    u1.profile2!.identity.meta!.bar = 'bababar';
    u1.profile2!.identity.links.push(new IdentityLink('l5'));
    u2.profile1!.identity.links = [new IdentityLink('l6'), new IdentityLink('l7')];
    u2.profile2!.identity.links.push(new IdentityLink('l8'));
    await orm.em.flush();
    expect(mock.mock.calls[0][0]).toMatch(`bulk = db.getCollection('user').initializeUnorderedBulkOp({ session: undefined });bulk.find({ _id: ObjectId('600000000000000000000001') }).update({ '$set': { profile1_identity_email: 'e123', profile1_identity_meta_foo: 'foooooooo', profile2: { username: 'u2', identity: { email: 'e2', meta: { foo: 'f2', bar: 'bababar', source: ObjectId('600000000000000000000005') }, links: [ { url: 'l5', meta: [Object], metas: [Array] } ], source: ObjectId('600000000000000000000006') }, source: ObjectId('600000000000000000000007') } } });bulk.find({ _id: ObjectId('600000000000000000000011') }).update({ '$set': { profile1_identity_links: [ { url: 'l6', meta: { foo: 'f1', bar: 'b1' }, metas: [ { foo: 'f2', bar: 'b2' }, { foo: 'f3', bar: 'b3' }, { foo: 'f4', bar: 'b4' } ] }, { url: 'l7', meta: { foo: 'f1', bar: 'b1' }, metas: [ { foo: 'f2', bar: 'b2' }, { foo: 'f3', bar: 'b3' }, { foo: 'f4', bar: 'b4' } ] } ], profile2: { username: 'u4', identity: { email: 'e4', meta: { foo: 'f4' }, links: [ { url: 'l3', meta: [Object], metas: [Array], source: ObjectId('60000000000000000000001e') }, { url: 'l4', meta: [Object], metas: [Array], source: ObjectId('60000000000000000000001f') }, { url: 'l8', meta: [Object], metas: [Array] } ], source: ObjectId('60000000000000000000001d') }, source: ObjectId('60000000000000000000001c') } } });bulk.execute()`);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u3 = await orm.em.findOneOrFail(User, {
      profile1: { identity: { email: 'e123', meta: { foo: 'foooooooo' } } },
      profile2: { identity: { email: 'e2', meta: { foo: 'f2', bar: 'bababar' } } },
    });
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('user').find({ profile1_identity_email: 'e123', profile1_identity_meta_foo: 'foooooooo', 'profile2.identity.email': 'e2', 'profile2.identity.meta.foo': 'f2', 'profile2.identity.meta.bar': 'bababar' }, { session: undefined }).limit(1).toArray();`);
    expect(u3._id.toHexString()).toEqual(u1._id.toHexString());
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u4 = await orm.em.findOneOrFail(User, {
      profile1: { identity: { email: 'e123', meta: { foo: { $re: 'fo+' } } } },
      profile2: { identity: { email: 'e2', meta: { foo: 'f2', bar: { $re: '(ba)+r' } } } },
    });
    expect(u4._id.toHexString()).toEqual(u1._id.toHexString());
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('user').find({ profile1_identity_email: 'e123', profile1_identity_meta_foo: /fo+/, 'profile2.identity.email': 'e2', 'profile2.identity.meta.foo': 'f2', 'profile2.identity.meta.bar': /(ba)+r/ }, { session: undefined }).limit(1).toArray();`);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u5 = await orm.em.findOneOrFail(User, { $or: [{ profile1: { identity: { meta: { foo: 'foooooooo' } } } }, { profile2: { identity: { meta: { bar: 'bababar' } } } }] });
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('user').find({ '$or': [ { profile1_identity_meta_foo: 'foooooooo' }, { 'profile2.identity.meta.bar': 'bababar' } ] }, { session: undefined }).limit(1).toArray();`);
    expect(u5._id.toHexString()).toEqual(u1._id.toHexString());

    const err1 = `Invalid query for entity 'User', property 'city' does not exist in embeddable 'Identity'`;
    await expect(orm.em.findOneOrFail(User, { profile1: { identity: { city: 'London 1' } as any } })).rejects.toThrowError(err1);

    const err2 = `Invalid query for entity 'User', property 'city' does not exist in embeddable 'Identity'`;
    await expect(orm.em.findOneOrFail(User, { profile2: { identity: { city: 'London 1' } as any } })).rejects.toThrowError(err2);
  });

  test('populating entities in embeddables', async () => {
    await createUsers();

    const mock = mockLogger(orm);


    const users = await orm.em.find(User, {}, {
      populate: [
        'profile1.source',
        'profile1.identity.source',
        'profile1.identity.meta.source',
        'profile1.identity.links.source',
        'profile1.identity.links.metas.source',
      ],
      orderBy: { name: 'desc' },
    });

    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('user').find({}, { session: undefined }).sort([ [ 'name', -1 ] ]).toArray();`);
    expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('source').find({ _id: { '$in': [ ObjectId('600000000000000000000004'), ObjectId('600000000000000000000012') ] } }, { session: undefined }).sort([ [ '_id', 1 ] ]).toArray();`);
    expect(mock.mock.calls[2][0]).toMatch(`db.getCollection('source').find({ _id: { '$in': [ ObjectId('600000000000000000000003'), ObjectId('600000000000000000000013') ] } }, { session: undefined }).sort([ [ '_id', 1 ] ]).toArray();`);
    expect(mock.mock.calls[3][0]).toMatch(`db.getCollection('source').find({ _id: { '$in': [ ObjectId('600000000000000000000002') ] } }, { session: undefined }).sort([ [ '_id', 1 ] ]).toArray();`);
    expect(mock.mock.calls[4][0]).toMatch(`db.getCollection('source').find({ _id: { '$in': [ ObjectId('600000000000000000000014'), ObjectId('600000000000000000000015') ] } }, { session: undefined }).sort([ [ '_id', 1 ] ]).toArray();`);
    expect(mock.mock.calls[5][0]).toMatch(`db.getCollection('source').find({ _id: { '$in': [ ObjectId('600000000000000000000016'), ObjectId('600000000000000000000017'), ObjectId('600000000000000000000018'), ObjectId('600000000000000000000019'), ObjectId('60000000000000000000001a'), ObjectId('60000000000000000000001b') ] } }, { session: undefined }).sort([ [ '_id', 1 ] ]).toArray();`);
    expect(wrap(users[0].profile1.source).isInitialized()).toBe(true);
    expect(users[0].profile1.source!.name).toBe('s1');
    expect(wrap(users[1].profile1.identity.links[1].source).isInitialized()).toBe(true);
    expect(users[1].profile1.identity.links[1].source!.name).toBe('ils32');
    expect(wrap(users[1].profile1.identity.links[1].metas[2].source).isInitialized()).toBe(true);
    expect(users[1].profile1.identity.links[1].metas[2].source!.name).toBe('ilms323');

    // test serialization context
    expect(wrap(users[0]).toObject()).toMatchObject({
      profile1: {
        source: { name: 's1' },
        identity: {
          source: { name: 'is1' },
          meta: { source: { name: 'ims1' } },
        },
      },
    });
    expect(wrap(users[1]).toObject()).toMatchObject({
      profile1: {
        source: { name: 's3' },
        identity: {
          source: { name: 'is3' },
          links: [
            { metas: [{ source: { name: 'ilms311' } }, { source: { name: 'ilms312' } }, { source: { name: 'ilms313' } }] },
            { metas: [{ source: { name: 'ilms321' } }, { source: { name: 'ilms322' } }, { source: { name: 'ilms323' } }] },
          ],
        },
      },
    });
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
