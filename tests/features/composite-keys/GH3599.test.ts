import { Cascade, Collection, Entity, Ref, ManyToOne, OneToMany, PrimaryKey, wrap } from '@mikro-orm/core';
import { MikroORM, SqliteDriver } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';
import { mockLogger } from '../../helpers.js';

@Entity()
export class Group {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @OneToMany({
    entity: () => GroupMember,
    mappedBy: (gm: GroupMember) => gm.group,
  })
  members = new Collection<GroupMember>(this);

}

@Entity()
export class Member {

  @PrimaryKey({ type: 'uuid' })
  id: string = v4();

  @OneToMany({
    entity: () => GroupMember,
    mappedBy: (group: GroupMember) => group.member,
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  groups = new Collection<GroupMember>(this);

}

@Entity()
export class GroupMember {

  @ManyToOne({
    entity: () => Member,
    inversedBy: (member: Member) => member.groups,
    primary: true,
    ref: true,
  })
  member: Ref<Member>;

  @ManyToOne({
    entity: () => Group,
    inversedBy: (group: Group) => group.members,
    primary: true,
    ref: true,
  })
  group: Ref<Group>;

  constructor(member: Member, group: Group) {
    this.member = wrap(member).toReference();
    this.group = wrap(group).toReference();
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    driver: SqliteDriver,
    entities: [Group, Member, GroupMember],
  });
  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

const createEntities = async (orm: MikroORM): Promise<{ member: Member; group2: Group; group1: Group }> => {
  const group1 = new Group();
  const group2 = new Group();
  const member = new Member();

  await orm.em.persistAndFlush([group1, group2, member]);
  return { group1, group2, member };
};

test('GH 3599 with explicit collection API', async () => {
  const { group1, group2, member } = await createEntities(orm);
  const mock = mockLogger(orm, ['query']);

  // adding a row to the pivot table
  member.groups.set([orm.em.create(GroupMember, { group: group1, member })]);

  await orm.em.flush();

  // adding a new row to the pivot table
  member.groups.set([
    orm.em.create(GroupMember, { group: group1, member }),
    orm.em.create(GroupMember, { group: group2, member }),
  ]);

  await orm.em.flush();

  // removing a row from the pivot table
  member.groups.set([orm.em.create(GroupMember, { group: group1, member })]);

  await orm.em.flush();
  const queries = mock.mock.calls.map(c => c[0]);

  expect(queries[0]).toMatch('begin');
  expect(queries[1]).toMatch('insert into `group_member` (`member_id`, `group_id`) values (?, ?)');
  expect(queries[2]).toMatch('commit');

  expect(queries[3]).toMatch('begin');
  expect(queries[4]).toMatch('insert into `group_member` (`member_id`, `group_id`) values (?, ?)');
  expect(queries[5]).toMatch('commit');

  expect(queries[6]).toMatch('begin');
  expect(queries[7]).toMatch('delete from `group_member` where (`member_id`, `group_id`) in ((?, ?))');
  expect(queries[8]).toMatch('commit');
});

test('GH 3599 with assign helper', async () => {
  const { group1, group2, member } = await createEntities(orm);
  const mock = mockLogger(orm, ['query']);

  // adding a row to the pivot table
  orm.em.assign(member, {
    groups: [
      { group: group1.id },
    ],
  });

  await orm.em.flush();

  // adding a new row to the pivot table
  orm.em.assign(member, {
    groups: [
      { group: group1.id },
      { group: group2.id },
    ],
  });

  await orm.em.flush();

  // removing a row from the pivot table
  orm.em.assign(member, {
    groups: [
      { group: group1.id },
    ],
  });

  await orm.em.flush();
  const queries = mock.mock.calls.map(c => c[0]);

  expect(queries[0]).toMatch('begin');
  expect(queries[1]).toMatch('insert into `group_member` (`member_id`, `group_id`) values (?, ?)');
  expect(queries[2]).toMatch('commit');

  expect(queries[3]).toMatch('begin');
  expect(queries[4]).toMatch('insert into `group_member` (`member_id`, `group_id`) values (?, ?)');
  expect(queries[5]).toMatch('commit');

  expect(queries[6]).toMatch('begin');
  expect(queries[7]).toMatch('delete from `group_member` where (`member_id`, `group_id`) in ((?, ?))');
  expect(queries[8]).toMatch('commit');
});

test('em.create and composite PK propagation', async () => {
  const group1 = new Group();
  const group2 = new Group();
  await orm.em.persist([group1, group2]).flush();

  const mock = mockLogger(orm, ['query']);

  const member = orm.em.create(Member, {
    groups: [
      { group: group1.id },
    ],
  });

  await orm.em.flush();

  // adding a new row to the pivot table
  orm.em.assign(member, {
    groups: [
      { group: group1.id },
      { group: group2.id },
    ],
  });

  await orm.em.flush();

  // removing a row from the pivot table
  orm.em.assign(member, {
    groups: [
      { group: group1.id },
    ],
  });

  await orm.em.flush();
  const queries = mock.mock.calls.map(c => c[0]);

  expect(queries[0]).toMatch('begin');
  expect(queries[1]).toMatch('insert into `member` (`id`) values (?)');
  expect(queries[2]).toMatch('insert into `group_member` (`member_id`, `group_id`) values (?, ?)');
  expect(queries[3]).toMatch('commit');

  expect(queries[4]).toMatch('begin');
  expect(queries[5]).toMatch('insert into `group_member` (`member_id`, `group_id`) values (?, ?)');
  expect(queries[6]).toMatch('commit');

  expect(queries[7]).toMatch('begin');
  expect(queries[8]).toMatch('delete from `group_member` where (`member_id`, `group_id`) in ((?, ?))');
  expect(queries[9]).toMatch('commit');
});
