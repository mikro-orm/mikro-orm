import { BigIntType, Cascade, Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({ tableName: 'user' })
class User {

  @PrimaryKey({ type: BigIntType, fieldName: 'id' })
  id!: number;

  @ManyToOne('Member', { fieldName: 'ownerMemberId', nullable: true, wrappedReference: true })
  ownerMember?: IdentifiedReference<Member>;

}

@Entity({ tableName: 'member' })
class Member {

  @PrimaryKey({ type: BigIntType, fieldName: 'id' })
  id!: number;

  @OneToMany(() => User, user => user.ownerMember, { cascade: [Cascade.ALL] })
  ownedUsers = new Collection<User>(this);

  @OneToMany('MemberUser', 'member', { orphanRemoval: true })
  users = new Collection<MemberUser>(this);

}

@Entity({ tableName: 'member_user' })
class MemberUser {

  @PrimaryKey({ type: BigIntType, fieldName: 'id' })
  id!: number;

  @ManyToOne(() => Member, { fieldName: 'memberId', wrappedReference: true })
  member!: IdentifiedReference<Member>;

  @ManyToOne(() => User, { fieldName: 'userId', wrappedReference: true })
  user?: IdentifiedReference<User>;

}

describe('GH issue 2410', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Member, MemberUser],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('should properly cascade delete inside transaction', async () => {
    const user = orm.em.create(User, {});
    orm.em.persist(user);
    await orm.em.flush();

    const createdMember = orm.em.create(Member, {});
    orm.em.persist(createdMember);
    await orm.em.persistAndFlush(createdMember);

    const mu = orm.em.create(MemberUser, {
      member: createdMember.id,
      user: user.id,
    });
    await orm.em.persistAndFlush(mu);

    await orm.em.transactional(async tx => {
      const member = await tx.findOne(Member, createdMember.id, {
        populate: ['ownedUsers'],
      });

      if (member) {
        member.users.removeAll();
        tx.remove(member);
      }
    });
  });

});
