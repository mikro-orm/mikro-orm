import { assign, Embeddable, Embedded, Entity, Logger, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

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
class IdentityLink {

  @Property({ nullable: true })
  url?: string;

  @Property({ nullable: true })
  createdAt?: Date;

  @Embedded(() => IdentityMeta)
  meta?: IdentityMeta;

  @Embedded(() => IdentityMeta, { array: true })
  metas: IdentityMeta[] = [];

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
      entities: [User, Profile, Identity, IdentityMeta, IdentityLink],
      type: 'postgresql',
      dbName: `mikro_orm_test_nested_embedddables`,
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
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
  });

  test('persist and load', async () => {
    const user1 = new User();
    user1.name = 'Uwe';
    user1.profile1 = new Profile('u1', new Identity('e1', new IdentityMeta('f1', 'b1')));
    user1.profile2 = new Profile('u2', new Identity('e2', new IdentityMeta('f2', 'b2')));

    const user2 = new User();
    user2.name = 'Uschi';
    user2.profile1 = new Profile('u3', new Identity('e3'));
    user2.profile1.identity.links.push(new IdentityLink('l1'), new IdentityLink('l2'));
    user2.profile2 = new Profile('u4', new Identity('e4', new IdentityMeta('f4')));
    user2.profile2.identity.links.push(new IdentityLink('l3'), new IdentityLink('l4'));

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });
    await orm.em.persistAndFlush([user1, user2]);
    orm.em.clear();
    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "user" ("name", "profile1_username", "profile1_identity_email", "profile1_identity_meta_foo", "profile1_identity_meta_bar", "profile1_identity_links", "profile2") values ('Uwe', 'u1', 'e1', 'f1', 'b1', '[]', '{"username":"u2","identity":{"email":"e2","meta":{"foo":"f2","bar":"b2"},"links":[]}}'), ('Uschi', 'u3', 'e3', NULL, NULL, '[{"url":"l1","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]},{"url":"l2","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]}]', '{"username":"u4","identity":{"email":"e4","meta":{"foo":"f4"},"links":[{"url":"l3","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]},{"url":"l4","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]}]}}') returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`commit`);

    const u1 = await orm.em.findOneOrFail(User, user1.id);
    const u2 = await orm.em.findOneOrFail(User, user2.id);
    expect(mock.mock.calls[3][0]).toMatch(`select "e0".* from "user" as "e0" where "e0"."id" = 1 limit 1`);
    expect(u1.profile1).toBeInstanceOf(Profile);
    expect(u1.profile1.identity).toBeInstanceOf(Identity);
    expect(u1.profile1.identity.meta).toBeInstanceOf(IdentityMeta);
    expect(u1.profile1).toMatchObject({
      username: 'u1',
      identity: {
        email: 'e1',
        links: [],
        meta: {
          bar: 'b1',
          foo: 'f1',
        },
      },
    });
    expect(u1.profile2).toBeInstanceOf(Profile);
    expect(u1.profile2.identity).toBeInstanceOf(Identity);
    expect(u1.profile2.identity.meta).toBeInstanceOf(IdentityMeta);
    expect(u1.profile2).toMatchObject({
      username: 'u2',
      identity: {
        email: 'e2',
        links: [],
        meta: {
          bar: 'b2',
          foo: 'f2',
        },
      },
    });
    expect(u2.profile1).toBeInstanceOf(Profile);
    expect(u2.profile1.identity).toBeInstanceOf(Identity);
    expect(u2.profile1.identity.links[0]).toBeInstanceOf(IdentityLink);
    expect(u2.profile1).toEqual({
      username: 'u3',
      identity: {
        email: 'e3',
        links: [
          { url: 'l1', meta: { bar: 'b1', foo: 'f1' }, metas: [
            { bar: 'b2', foo: 'f2' },
            { bar: 'b3', foo: 'f3' },
            { bar: 'b4', foo: 'f4' },
          ] },
          { url: 'l2', meta: { bar: 'b1', foo: 'f1' }, metas: [
            { bar: 'b2', foo: 'f2' },
            { bar: 'b3', foo: 'f3' },
            { bar: 'b4', foo: 'f4' },
          ] },
        ],
      },
    });
    expect(u2.profile2).toBeInstanceOf(Profile);
    expect(u2.profile2.identity).toBeInstanceOf(Identity);
    expect(u2.profile2.identity.links[0]).toBeInstanceOf(IdentityLink);
    expect(u2.profile2.identity.meta).toBeInstanceOf(IdentityMeta);
    expect(u2.profile2).toEqual({
      username: 'u4',
      identity: {
        email: 'e4',
        links: [
          { url: 'l3', meta: { bar: 'b1', foo: 'f1' }, metas: [
              { bar: 'b2', foo: 'f2' },
              { bar: 'b3', foo: 'f3' },
              { bar: 'b4', foo: 'f4' },
            ] },
          { url: 'l4', meta: { bar: 'b1', foo: 'f1' }, metas: [
              { bar: 'b2', foo: 'f2' },
              { bar: 'b3', foo: 'f3' },
              { bar: 'b4', foo: 'f4' },
            ] },
        ],
        meta: {
          foo: 'f4',
        },
      },
    });

    expect(mock.mock.calls.length).toBe(5);
    await orm.em.flush();
    expect(mock.mock.calls.length).toBe(5);

    u1.profile1!.identity.email = 'e123';
    u1.profile1!.identity.meta!.foo = 'foooooooo';
    u1.profile2!.identity.meta!.bar = 'bababar';
    u1.profile2!.identity.links.push(new IdentityLink('l5'));
    u2.profile1!.identity.links = [new IdentityLink('l6'), new IdentityLink('l7')];
    u2.profile2!.identity.links.push(new IdentityLink('l8'));
    await orm.em.flush();
    expect(mock.mock.calls[6][0]).toMatch(`update "user" set "profile1_identity_email" = case when ("id" = 1) then 'e123' else "profile1_identity_email" end, "profile1_identity_meta_foo" = case when ("id" = 1) then 'foooooooo' else "profile1_identity_meta_foo" end, "profile2" = case when ("id" = 1) then '{"username":"u2","identity":{"email":"e2","meta":{"foo":"f2","bar":"bababar"},"links":[{"url":"l5","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]}]}}' when ("id" = 2) then '{"username":"u4","identity":{"email":"e4","meta":{"foo":"f4"},"links":[{"url":"l3","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]},{"url":"l4","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]},{"url":"l8","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]}]}}' else "profile2" end, "profile1_identity_links" = case when ("id" = 2) then '[{"url":"l6","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]},{"url":"l7","meta":{"foo":"f1","bar":"b1"},"metas":[{"foo":"f2","bar":"b2"},{"foo":"f3","bar":"b3"},{"foo":"f4","bar":"b4"}]}]' else "profile1_identity_links" end where "id" in (1, 2)`);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u3 = await orm.em.findOneOrFail(User, {
      profile1: { identity: { email: 'e123', meta: { foo: 'foooooooo' } } },
      profile2: { identity: { email: 'e2', meta: { foo: 'f2', bar: 'bababar' } } },
    });
    expect(mock.mock.calls[0][0]).toMatch(`select "e0".* from "user" as "e0" where "e0"."profile1_identity_email" = 'e123' and "e0"."profile1_identity_meta_foo" = 'foooooooo' and "e0"."profile2"->'identity'->>'email' = 'e2' and "e0"."profile2"->'identity'->'meta'->>'foo' = 'f2' and "e0"."profile2"->'identity'->'meta'->>'bar' = 'bababar' limit 1`);
    expect(u3.id).toEqual(u1.id);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u4 = await orm.em.findOneOrFail(User, {
      profile1: { identity: { email: 'e123', meta: { foo: { $re: 'fo+' } } } },
      profile2: { identity: { email: 'e2', meta: { foo: 'f2', bar: { $re: '(ba)+r' } } } },
    });
    expect(u4.id).toEqual(u1.id);
    expect(mock.mock.calls[0][0]).toMatch(`select "e0".* from "user" as "e0" where "e0"."profile1_identity_email" = 'e123' and "e0"."profile1_identity_meta_foo" ~ 'fo+' and "e0"."profile2"->'identity'->>'email' = 'e2' and "e0"."profile2"->'identity'->'meta'->>'foo' = 'f2' and "e0"."profile2"->'identity'->'meta'->>'bar' ~ '(ba)+r' limit 1`);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const u5 = await orm.em.findOneOrFail(User, { $or: [{ profile1: { identity: { meta: { foo: 'foooooooo' } } } }, { profile2: { identity: { meta: { bar: 'bababar' } } } }] });
    expect(mock.mock.calls[0][0]).toMatch(`select "e0".* from "user" as "e0" where ("e0"."profile1_identity_meta_foo" = 'foooooooo' or "e0"."profile2"->'identity'->'meta'->>'bar' = 'bababar') limit 1`);
    expect(u5.id).toEqual(u1.id);

    const err1 = `Invalid query for entity 'User', property 'city' does not exist in embeddable 'Identity'`;
    await expect(orm.em.findOneOrFail(User, { profile1: { identity: { city: 'London 1' } as any } })).rejects.toThrowError(err1);

    const err2 = `Invalid query for entity 'User', property 'city' does not exist in embeddable 'Identity'`;
    await expect(orm.em.findOneOrFail(User, { profile2: { identity: { city: 'London 1' } as any } })).rejects.toThrowError(err2);
  });

  test('#assign() works with nested embeddables', async () => {
    const jon = new User();

    assign(jon, {
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

    assign(jon, { profile1: { identity: { email: 'e3' } } }, { mergeObjects: true });
    expect(jon.profile1.username).toBe('u1');
    expect(jon.profile1.identity.email).toBe('e3');
    expect(jon.profile1.identity.meta).not.toBeUndefined();
    delete jon.profile1.identity.meta;

    assign(jon, { profile1: { identity: { meta: { foo: 'f' } } } }, { mergeObjects: true });
    expect(jon.profile1.identity.meta!.foo).toBe('f');
    expect(jon.profile1.identity.meta).toBeInstanceOf(IdentityMeta);

    assign(jon, { profile1: { identity: { email: 'e4' } } });
    expect(jon.profile1.username).toBeUndefined();
    expect(jon.profile1.identity.email).toBe('e4');
    expect(jon.profile1.identity.meta).toBeUndefined();
  });

});
