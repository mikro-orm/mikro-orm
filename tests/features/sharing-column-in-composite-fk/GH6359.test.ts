import { Collection, EntitySchema, MikroORM } from '@mikro-orm/postgresql';
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

class ActivityNote {

  id!: number;
  auth_user!: AuthUser;
  org!: Org;
  content!: string;

}

const ActivityNoteSchema = new EntitySchema({
  class: ActivityNote,
  tableName: 'activity_note',
  uniques: [{ name: 'activity_note_id_org_id_key', properties: ['id', 'org'] }],
  properties: {
    id: { primary: true, type: 'integer' },
    content: { type: 'text' },
    auth_user: {
      kind: 'm:1',
      entity: () => AuthUser,
      fieldName: 'user_id',
    },
    org: {
      kind: 'm:1',
      entity: () => Org,
      fieldName: 'org_id',
      deleteRule: 'cascade',
    },
  },
});

class AuthUser {

  org!: Org;
  id!: number;
  activityNoteCollection = new Collection<ActivityNote>(this);

}

const UserSchema = new EntitySchema({
  class: AuthUser,
  tableName: 'auth_user',
  properties: {
    org: { kind: 'm:1', entity: () => Org, fieldName: 'org_id' },
    id: { primary: true, type: 'integer', unique: 'auth_user_id_key' },
    activityNoteCollection: {
      kind: '1:m',
      entity: () => ActivityNote,
      mappedBy: 'auth_user',
    },
  },
});

const schema = `
    drop table if exists org cascade;
    drop table if exists auth_user cascade;
    drop table if exists activity_note cascade;

    create table if not exists org (
      id serial primary key
    );

    create table if not exists auth_user (
      id serial primary key,
      org_id int not null references org,
      unique (id, org_id)
    );

    create table if not exists activity_note (
      id serial primary key,
      user_id integer not null,
      org_id  integer not null references org on update restrict on delete cascade,
      content text not null,
      unique (id, org_id),
      foreign key (org_id, user_id) references auth_user (org_id, id) on update restrict
    );
`;

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [OrgSchema, UserSchema, ActivityNoteSchema],
    dbName: '6359',
  });
  await orm.schema.execute(schema);
});

afterAll(async () => {
  await orm.close(true);
});

test('Query 1', async () => {
  await orm.em.insert(new Org());
  const org = orm.em.getReference(Org, 1);

  const user = new AuthUser();
  user.org = org;

  const notes = ['1', '2', '3'];

  user.activityNoteCollection.add(notes.map(n => {
    const note = new ActivityNote();
    note.content = n;
    note.org = org;

    return note;
  }));

  const mock = mockLogger(orm);
  await orm.em.persistAndFlush(user);
  expect(mock.mock.calls).toHaveLength(4);
  expect(mock.mock.calls[1][0]).toMatch(`insert into "auth_user" ("org_id") values (1) returning "id"`);
  expect(mock.mock.calls[2][0]).toMatch(`insert into "activity_note" ("content", "user_id", "org_id") values ('1', 1, 1), ('2', 1, 1), ('3', 1, 1) returning "id"`);
});

test('Query 2', async () => {
  const qb = orm.em.createQueryBuilder(ActivityNote)
    .select('*')
    .where({
      org: 1,
      auth_user: 1,
    });
  expect(qb.getFormattedQuery()).toBe('select "a0".* from "activity_note" as "a0" where "a0"."org_id" = 1 and "a0"."user_id" = 1');
  await qb.getResult();
});
