import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Ref, RequiredEntityData } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Group {

  @PrimaryKey()
  id!: number;

  @OneToMany({
    entity: () => GroupMember,
    mappedBy: member => member.group,
    eager: true,
    orphanRemoval: true,
  })
  members = new Collection<GroupMember>(this);

  constructor(params: RequiredEntityData<Group>) {
    Object.assign(this, params);
  }

}

@Entity()
class GroupMember {

  @ManyToOne({
    entity: () => Member,
    primary: true,
    ref: true,
  })
  member!: Ref<Member>;

  @ManyToOne({
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

  @OneToMany({
    entity: () => GroupMember,
    mappedBy: group => group.member,
    eager: true,
    orphanRemoval: true,
  })
  groups = new Collection<GroupMember>(this);

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

test(`GH issue 4234 with 1:m`, async () => {
  const groupId = 1;
  const memberId = 2;

  {
    const group = new Group({ id: groupId });
    const member = new Member({ id: memberId });
    member.groups.add(new GroupMember({ group, member }));
    await orm.em.persist([group, member]).flush();
    orm.em.clear();
  }

  {
    await orm.em.findOne(Group, groupId);
    const member = await orm.em.findOneOrFail(Member, memberId);
    orm.em.assign(member, { groups: [] });
    await orm.em.flush();
    await orm.em.flush();
  }

  orm.em.clear();
  await orm.em.findOneOrFail(Member, memberId);
  await orm.em.findOneOrFail(Group, groupId);
  await expect(orm.em.findOne(GroupMember, { group: groupId, member: memberId })).resolves.toBeNull();
});
