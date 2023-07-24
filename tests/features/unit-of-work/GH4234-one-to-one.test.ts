import { Entity, OneToOne, PrimaryKey, ref, Ref, RequiredEntityData } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Group {

  @PrimaryKey()
  id!: number;

  @OneToOne({
    entity: () => GroupMember,
    mappedBy: member => member.group,
    ref: true,
    eager: true,
    orphanRemoval: true,
  })
  groupMember?: Ref<GroupMember>;

  constructor(params: RequiredEntityData<Group>) {
    Object.assign(this, params);
  }

}

@Entity()
class GroupMember {

  @OneToOne({
    entity: () => Member,
    primary: true,
    ref: true,
  })
  member!: Ref<Member>;

  @OneToOne({
    entity: () => Group,
    primary: true,
    ref: true,
  })
  group!: Ref<Group>;

  constructor(params: RequiredEntityData<GroupMember>) {
    Object.assign(this, params);
  }

}

@Entity()
class Member {

  @PrimaryKey()
  id!: number;

  @OneToOne({
    entity: () => GroupMember,
    mappedBy: group => group.member,
    eager: true,
    ref: true,
    orphanRemoval: true,
  })
  groupMember?: Ref<GroupMember>;

  constructor(params: RequiredEntityData<Member>) {
    Object.assign(this, params);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Group, Member, GroupMember],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test(`GH issue 4234 with 1:1`, async () => {
  const groupId = 1;
  const memberId = 2;

  {
    const group = new Group({ id: groupId });
    const member = new Member({ id: memberId });
    member.groupMember = ref(new GroupMember({ group, member }));
    await orm.em.persist([group, member]).flush();
    orm.em.clear();
  }

  {
    await orm.em.findOne(Group, groupId);
    const member = await orm.em.findOneOrFail(Member, memberId);
    orm.em.assign(member, { groupMember: null });
    await orm.em.flush();
    await orm.em.flush();
  }

  orm.em.clear();
  await orm.em.findOneOrFail(Member, memberId);
  await orm.em.findOneOrFail(Group, groupId);
});
