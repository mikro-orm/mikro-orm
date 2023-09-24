import { Cascade, Collection, Entity, Ref, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/sqlite';
import { BigIntType } from '@mikro-orm/postgresql';

@Entity({ tableName: 'user' })
class User {

  @PrimaryKey({ type: new BigIntType('number') })
  id!: number;

  @ManyToOne('Member', { fieldName: 'ownerMemberId', nullable: true, ref: true })
  ownerMember?: Ref<Member>;

}

@Entity({ tableName: 'member' })
class Member {

  @PrimaryKey()
  id!: bigint;

  @OneToMany(() => User, user => user.ownerMember, { cascade: [Cascade.ALL] })
  ownedUsers = new Collection<User>(this);

  @OneToMany('MemberUser', 'member', { orphanRemoval: true })
  users = new Collection<MemberUser>(this);

}

@Entity({ tableName: 'member_user' })
class MemberUser {

  @PrimaryKey({ type: new BigIntType('string') })
  id!: string;

  @ManyToOne(() => Member, { fieldName: 'memberId', ref: true })
  member!: Ref<Member>;

  @ManyToOne(() => User, { fieldName: 'userId', ref: true })
  user?: Ref<User>;

}

describe('GH issue 2410', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, Member, MemberUser],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
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

    // different bigint PKs are mapped to bigint/number/string
    expect(mu.id).toBe('1');
    expect(mu.member.id).toBe(1n);
    expect(mu.user?.id).toBe(1);

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
