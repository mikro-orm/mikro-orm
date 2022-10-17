import {
  Cascade,
  Collection,
  Entity,
  EntityData,
  IdentifiedReference,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  PrimaryKeyType, wrap,
} from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { v4 } from 'uuid';
import { mockLogger } from '../../helpers';

@Entity()
export class Group {

  @PrimaryKey({ columnType: 'uuid' })
  public id: string = v4();

  @OneToMany({
    entity: 'GroupMember',
    mappedBy: (gm: GroupMember) => gm.group,
  })
  public members = new Collection<GroupMember>(this);


  constructor(params: EntityData<Group>) {
    Object.assign(this, params);
  }

}

@Entity()
export class GroupMember {

  @ManyToOne({
    entity: 'Member',
    inversedBy: (member: Member) => member.groups,
    primary: true,
    wrappedReference: true,
  })
  public member!: IdentifiedReference<Member>;

  @ManyToOne({
    entity: 'Group',
    inversedBy: (group: Group) => group.members,
    primary: true,
    wrappedReference: true,
  })
  public group!: IdentifiedReference<Group>;

  public [PrimaryKeyType]!: [string, string];
  public [PrimaryKeyProp]!: 'member' | 'group';

  constructor(params: EntityData<GroupMember>) {
    Object.assign(this, params);
  }

}

@Entity()
export class Member {

  @PrimaryKey({ columnType: 'uuid' })
  public id: string = v4();

  @OneToMany({
    entity: 'GroupMember',
    mappedBy: (group: GroupMember) => group.member,
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  public groups = new Collection<GroupMember>(this);

  constructor(params: EntityData<Member>) {
    Object.assign(this, params);
  }

}

const createEntities = async (orm: MikroORM): Promise<{ member: Member; group2: Group; group1: Group }> => {
  const group1 = new Group({});
  const group2 = new Group({});
  const member = new Member({});

  await orm.em.persistAndFlush([group1, group2, member]);
  return { group1, group2, member };
};

describe('GH 3599', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: 'mikro_orm_test_3599',
      type: 'postgresql',
      entities: [Group, Member, GroupMember],
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('GH 3599', async () => {
    const { group1, group2, member } = await createEntities(orm);
    const mock = mockLogger(orm, ['query']);

    // adding a row to the pivot table
    orm.em.assign(member, {
      groups: [
        {
          group: group1.id,
          member: member.id,
        },
      ],
    });

    await orm.em.persistAndFlush(member);

    // adding a new row to the pivot table
    orm.em.assign(member, {
      groups: [
        {
          group: group1.id,
          member: member.id,
        },
        {
          group: group2.id,
          member: member.id,
        },
      ],
    });

    await orm.em.persistAndFlush(member);

    // removing a row from the pivot table
    orm.em.assign(member, {
      groups: [
        {
          group: group1.id,
          member: member.id,
        },
      ],
    });

    await orm.em.persistAndFlush(member);
    const queries: string[] = mock.mock.calls.map(c => c[0]);

    expect(queries[0]).toMatch('begin');
    expect(queries[1]).toMatch('insert into "group_member" ("group_id", "member_id") values ($1, $2)');
    expect(queries[2]).toMatch('commit');

    expect(queries[3]).toMatch('begin');
    expect(queries[4]).toMatch('insert into "group_member" ("group_id", "member_id") values ($1, $2)');
    expect(queries[5]).toMatch('commit');

    expect(queries[6]).toMatch('begin');
    expect(queries[7]).toMatch('delete from "group_member" where ("member_id", "group_id") in (($1, $2))');
    expect(queries[8]).toMatch('commit');

    const result = (await orm.em.findOne(Member, member.id))!;

    expect(result.groups).toHaveLength(1);
    expect(wrap(result.groups[0]).toJSON()).toMatchObject({
      member: {
        id: member.id,
      },
      group: {
        id: group1.id,
      },
    });
  });
});
