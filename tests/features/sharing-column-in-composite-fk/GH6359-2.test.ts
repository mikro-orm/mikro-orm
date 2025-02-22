import { EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { mockLogger } from '../../helpers.js';

class Org {

  id!: number;

}

const OrgSchema = new EntitySchema({
  class: Org,
  tableName: 'org',
  properties: {
    id: { primary: true, type: 'integer' },
  },
});

class UserGroup {

  id!: number;
  org!: Org;
  name!: string;

}

const UserGroupSchema = new EntitySchema({
  class: UserGroup,
  tableName: 'user_group',
  uniques: [
    { name: 'user_group_id_org_id_key', properties: ['id', 'org'] },
    { name: 'user_group_org_id_name_key', properties: ['org', 'name'] },
  ],
  properties: {
    id: { primary: true, type: 'integer' },
    org: { kind: 'm:1', entity: () => Org, fieldName: 'org_id' },
    name: { type: 'text' },
  },
});

class Draft {

  id!: number;
  org!: Org;
  user_group?: UserGroup;
  name!: string;

}

const DraftSchema = new EntitySchema({
  class: Draft,
  tableName: 'draft',
  properties: {
    id: { primary: true, type: 'integer' },
    org: { kind: 'm:1', entity: () => Org, fieldName: 'org_id' },
    user_group: {
      kind: 'm:1',
      entity: () => UserGroup,
      fieldName: 'user_group_id',
      nullable: true,
    },
    name: { type: 'text' },
  },
});

class TestModel {

  id!: number;
  external_id?: string;
  name!: string;
  org!: Org;
  user_group?: UserGroup;
  draft!: Draft;

}

const TestModelSchema = new EntitySchema({
  class: TestModel,
  tableName: 'test_model',
  properties: {
    id: { primary: true, type: 'integer' },
    external_id: { type: 'text', nullable: true },
    name: { type: 'text' },
    org: {
      kind: 'm:1',
      entity: () => Org,
      fieldName: 'org_id',
      deleteRule: 'cascade',
    },
    user_group: {
      kind: 'm:1',
      entity: () => UserGroup,
      deleteRule: 'set null',
      nullable: true,
    },
    draft: { kind: 'm:1', entity: () => Draft, fieldName: 'draft_id' },
  },
});

let orm: MikroORM;

const schema = `
  drop table if exists org cascade;
  drop table if exists test_model cascade;
  drop table if exists draft cascade;
  drop table if exists user_group cascade;
  create table if not exists org (id serial primary key);
  create table user_group (
    id serial primary key,
    org_id integer not null references org on update restrict on delete restrict,
    name text not null,
    unique (id, org_id),
    unique (org_id, name)
  );
  create table draft (
    id serial primary key,
    org_id integer not null references org on update restrict on delete restrict,
    user_group_id integer references user_group on update restrict on delete restrict,
    name text not null
  );
  create table test_model (
    id serial primary key,
    external_id text,
    name text not null,
    org_id integer not null references org on update restrict on delete cascade,
    user_group_id integer,
    draft_id integer not null references draft on update restrict on delete restrict,
    unique (org_id, id),
    unique (org_id, user_group_id, id),
    foreign key (user_group_id, org_id) references user_group (id, org_id) on update restrict on delete set null
  );
`;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [TestModel, UserGroup, Draft, Org],
    dbName: '6359',
  });

  await orm.schema.execute(schema);
});

afterAll(() => orm.close(true));

test('Query', async () => {
  const mock = mockLogger(orm);

  await orm.em.fork().find(
    TestModel,
    { org: 1, user_group: null },
    { fields: ['external_id'] },
  );

  await orm.em.fork().find(
    TestModel,
    { org: 1, user_group: 2 },
    { fields: ['external_id'] },
  );

  expect(mock.mock.calls[0][0]).toMatch('select "t0"."id", "t0"."external_id" from "test_model" as "t0" where "t0"."org_id" = 1 and "t0"."user_group_id" is null');
  expect(mock.mock.calls[1][0]).toMatch('select "t0"."id", "t0"."external_id" from "test_model" as "t0" where "t0"."org_id" = 1 and "t0"."user_group_id" = 2');
});
