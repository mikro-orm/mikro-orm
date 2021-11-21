import type { ObjectHydrator } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, ManyToOne, MikroORM, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers';

@Entity()
class Source {

  @PrimaryKey()
  id!: number;

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
  id!: number;

  @Property()
  name!: string;

  @Embedded(() => Profile)
  profile1!: Profile;

  @Embedded(() => Profile, { object: true })
  profile2!: Profile;

}

describe('embedded entities in postgres', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Profile, Identity, IdentityMeta, IdentityLink, Source],
      type: 'postgresql',
      dbName: `mikro_orm_test_entities_in_embedddables`,
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  beforeEach(async () => {
    const tables = Object.values(orm.getMetadata().getAll())
      .filter(meta => !meta.embeddable)
      .map(meta => meta.tableName);

    for (const table of tables) {
      await orm.em.createQueryBuilder(table).truncate().execute();
    }
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('schema', async () => {
    await expect(orm.getSchemaGenerator().getCreateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('nested embeddables 1');
    await expect(orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('nested embeddables 2');
    await expect(orm.getSchemaGenerator().getDropSchemaSQL({ wrap: false })).resolves.toMatchSnapshot('nested embeddables 3');
  });

  test('diffing', async () => {
    expect(orm.em.getComparator().getSnapshotGenerator('User').toString()).toMatchSnapshot();
    const metadata = orm.getMetadata();
    const hydrator = orm.config.getHydrator(metadata) as ObjectHydrator;
    expect(hydrator.getEntityHydrator(metadata.get('User'), 'full').toString()).toMatchSnapshot();
  });

  async function createUsers() {
    const user1 = new User();
    user1.name = 'Uwe';
    user1.profile1 = new Profile('u1', new Identity('e1', new IdentityMeta('f1', 'b1')));
    user1.profile1.source = new Source('s1');
    user1.profile1.identity.source = new Source('is1');
    user1.profile1.identity.meta!.source = new Source('ims1');
    user1.profile2 = new Profile('u2', new Identity('e2', new IdentityMeta('f2', 'b2')));
    user1.profile2.source = new Source('s2');
    user1.profile2.identity.source = new Source('is2');
    user1.profile2.identity.meta!.source = new Source('ims2');

    const user2 = new User();
    user2.name = 'Uschi';
    user2.profile1 = new Profile('u3', new Identity('e3'));
    user2.profile1.source = new Source('s3');
    user2.profile1.identity.links.push(new IdentityLink('l1'), new IdentityLink('l2'));
    user2.profile1.identity.source = new Source('is3');
    user2.profile1.identity.links[0].source = new Source('ils31');
    user2.profile1.identity.links[1].source = new Source('ils32');
    user2.profile1.identity.links[0].metas[0].source = new Source('ilms311');
    user2.profile1.identity.links[0].metas[1].source = new Source('ilms312');
    user2.profile1.identity.links[0].metas[2].source = new Source('ilms313');
    user2.profile1.identity.links[1].metas[0].source = new Source('ilms321');
    user2.profile1.identity.links[1].metas[1].source = new Source('ilms322');
    user2.profile1.identity.links[1].metas[2].source = new Source('ilms323');
    user2.profile2 = new Profile('u4', new Identity('e4', new IdentityMeta('f4')));
    user2.profile2.source = new Source('s4');
    user2.profile2.identity.links.push(new IdentityLink('l3'), new IdentityLink('l4'));
    user2.profile2.identity.source = new Source('is4');
    user2.profile2.identity.links[0].source = new Source('ils41');
    user2.profile2.identity.links[1].source = new Source('ils42');

    await orm.em.persistAndFlush([user1, user2]);
    orm.em.clear();

    return { user1, user2 };
  }

  test('persist and load', async () => {
    const mock = mockLogger(orm);
    const { user1, user2 } = await createUsers();

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "source" ("name") values ('s1'), ('is1'), ('ims1'), ('s2'), ('is2'), ('ims2'), ('s3'), ('is3'), ('ils31'), ('ils32'), ('ilms311'), ('ilms312'), ('ilms313'), ('ilms321'), ('ilms322'), ('ilms323'), ('s4'), ('is4'), ('ils41'), ('ils42') returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`insert into "user" ("name", "profile1_username", "profile1_identity_email", "profile1_identity_meta_foo", "profile1_identity_meta_bar", "profile1_identity_links", "profile2", "profile1_source_id", "profile1_identity_source_id", "profile1_identity_meta_source_id") values ('Uwe', 'u1', 'e1', 'f1', 'b1', '[]', '{"username":"u2","identity":{"email":"e2","meta":{"foo":"f2","bar":"b2","source":6},"links":[],"source":5},"source":4}', 1, 2, 3), ('Uschi', 'u3', 'e3', NULL, NULL, '[{"url":"l1","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2","source":11},{"foo":"f3","bar":"b3","source":12},{"foo":"f4","bar":"b4","source":13}],"source":9},{"url":"l2","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2","source":14},{"foo":"f3","bar":"b3","source":15},{"foo":"f4","bar":"b4","source":16}],"source":10}]', '{"username":"u4","identity":{"email":"e4","meta":{"foo":"f4"},"links":[{"url":"l3","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}],"source":19},{"url":"l4","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}],"source":20}],"source":18},"source":17}', 7, 8, NULL) returning "id"`);
    expect(mock.mock.calls[3][0]).toMatch(`commit`);

    const u1 = await orm.em.findOneOrFail(User, user1.id);
    const u2 = await orm.em.findOneOrFail(User, user2.id);
    expect(mock.mock.calls[4][0]).toMatch(`select "u0".* from "user" as "u0" where "u0"."id" = 1 limit 1`);
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
          source: { id: u1.profile1.identity.meta!.source!.id },
        },
      },
      source: { id: u1.profile1.source!.id },
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
          source: { id: u1.profile2.identity.meta!.source!.id },
        },
        source: { id: u1.profile2.identity.source!.id },
      },
      source: { id: u1.profile2.source!.id },
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
          { url: 'l1', meta: { bar: 'b1', foo: 'f1' }, source: { id: u2.profile1.identity.links[0].source!.id }, metas: [
            { bar: 'b2', foo: 'f2', source: { id: u2.profile1.identity.links[0].metas[0].source!.id } },
            { bar: 'b3', foo: 'f3', source: { id: u2.profile1.identity.links[0].metas[1].source!.id } },
            { bar: 'b4', foo: 'f4', source: { id: u2.profile1.identity.links[0].metas[2].source!.id } },
          ] },
          { url: 'l2', meta: { bar: 'b1', foo: 'f1' }, source: { id: u2.profile1.identity.links[1].source!.id }, metas: [
            { bar: 'b2', foo: 'f2', source: { id: u2.profile1.identity.links[1].metas[0].source!.id } },
            { bar: 'b3', foo: 'f3', source: { id: u2.profile1.identity.links[1].metas[1].source!.id } },
            { bar: 'b4', foo: 'f4', source: { id: u2.profile1.identity.links[1].metas[2].source!.id } },
          ] },
        ],
        source: { id: u2.profile1.identity.source!.id },
      },
      source: { id: u2.profile1.source!.id },
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
          { url: 'l3', meta: { bar: 'b1', foo: 'f1' }, source: { id: u2.profile2.identity.links[0].source!.id }, metas: [
              { bar: 'b2', foo: 'f2' },
              { bar: 'b3', foo: 'f3' },
              { bar: 'b4', foo: 'f4' },
            ] },
          { url: 'l4', meta: { bar: 'b1', foo: 'f1' }, source: { id: u2.profile2.identity.links[1].source!.id }, metas: [
              { bar: 'b2', foo: 'f2' },
              { bar: 'b3', foo: 'f3' },
              { bar: 'b4', foo: 'f4' },
            ] },
        ],
        meta: {
          foo: 'f4',
        },
        source: { id: u2.profile2.identity.source!.id },
      },
      source: { id: u2.profile2.source!.id },
    });

    expect(mock.mock.calls.length).toBe(6);
    await orm.em.flush();
    expect(mock.mock.calls.length).toBe(6);

    u1.profile1!.identity.email = 'e123';
    u1.profile1!.identity.meta!.foo = 'foooooooo';
    u1.profile2!.identity.meta!.bar = 'bababar';
    u1.profile2!.identity.links.push(new IdentityLink('l5'));
    u2.profile1!.identity.links = [new IdentityLink('l6'), new IdentityLink('l7')];
    u2.profile2!.identity.links.push(new IdentityLink('l8'));
    await orm.em.flush();
    expect(mock.mock.calls[7][0]).toMatch(`update "user" set "profile1_identity_email" = case when ("id" = 1) then 'e123' else "profile1_identity_email" end, "profile1_identity_meta_foo" = case when ("id" = 1) then 'foooooooo' else "profile1_identity_meta_foo" end, "profile2" = case when ("id" = 1) then '{"username":"u2","identity":{"email":"e2","meta":{"foo":"f2","bar":"bababar","source":6},"links":[{"url":"l5","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]}],"source":5},"source":4}' when ("id" = 2) then '{"username":"u4","identity":{"email":"e4","meta":{"foo":"f4"},"links":[{"url":"l3","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}],"source":19},{"url":"l4","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}],"source":20},{"url":"l8","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]}],"source":18},"source":17}' else "profile2" end, "profile1_identity_links" = case when ("id" = 2) then '[{"url":"l6","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]},{"url":"l7","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]}]' else "profile1_identity_links" end where "id" in (1, 2)`);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u3 = await orm.em.findOneOrFail(User, {
      profile1: { identity: { email: 'e123', meta: { foo: 'foooooooo' } } },
      profile2: { identity: { email: 'e2', meta: { foo: 'f2', bar: 'bababar' } } },
    });
    expect(mock.mock.calls[0][0]).toMatch(`select "u0".* from "user" as "u0" where "u0"."profile1_identity_email" = 'e123' and "u0"."profile1_identity_meta_foo" = 'foooooooo' and "u0"."profile2"->'identity'->>'email' = 'e2' and "u0"."profile2"->'identity'->'meta'->>'foo' = 'f2' and "u0"."profile2"->'identity'->'meta'->>'bar' = 'bababar' limit 1`);
    expect(u3.id).toEqual(u1.id);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u4 = await orm.em.findOneOrFail(User, {
      profile1: { identity: { email: 'e123', meta: { foo: { $re: 'fo+' } } } },
      profile2: { identity: { email: 'e2', meta: { foo: 'f2', bar: { $re: '(ba)+r' } } } },
    });
    expect(u4.id).toEqual(u1.id);
    expect(mock.mock.calls[0][0]).toMatch(`select "u0".* from "user" as "u0" where "u0"."profile1_identity_email" = 'e123' and "u0"."profile1_identity_meta_foo" ~ 'fo+' and "u0"."profile2"->'identity'->>'email' = 'e2' and "u0"."profile2"->'identity'->'meta'->>'foo' = 'f2' and "u0"."profile2"->'identity'->'meta'->>'bar' ~ '(ba)+r' limit 1`);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u5 = await orm.em.findOneOrFail(User, { $or: [{ profile1: { identity: { meta: { foo: 'foooooooo' } } } }, { profile2: { identity: { meta: { bar: 'bababar' } } } }] });
    expect(mock.mock.calls[0][0]).toMatch(`select "u0".* from "user" as "u0" where ("u0"."profile1_identity_meta_foo" = 'foooooooo' or "u0"."profile2"->'identity'->'meta'->>'bar' = 'bababar') limit 1`);
    expect(u5.id).toEqual(u1.id);

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
        'profile1.identity.links.metas.source',
      ],
      orderBy: { name: 'desc' },
    });

    expect(mock.mock.calls[0][0]).toMatch(`select "u0".* from "user" as "u0" order by "u0"."name" desc`);
    expect(mock.mock.calls[1][0]).toMatch(`select "s0".* from "source" as "s0" where "s0"."id" in (1, 7) order by "s0"."id" asc`);
    expect(mock.mock.calls[2][0]).toMatch(`select "s0".* from "source" as "s0" where "s0"."id" in (2, 8) order by "s0"."id" asc`);
    expect(mock.mock.calls[3][0]).toMatch(`select "s0".* from "source" as "s0" where "s0"."id" in (3) order by "s0"."id" asc`);
    expect(mock.mock.calls[4][0]).toMatch(`select "s0".* from "source" as "s0" where "s0"."id" in (11, 12, 13, 14, 15, 16) order by "s0"."id" asc`);
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
