import { Cascade, Collection, MikroORM, Ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { BigIntType } from '@mikro-orm/postgresql';

@Entity({ tableName: 'user' })
class User {
  @PrimaryKey({ type: BigIntType })
  id!: number;

  @ManyToOne(() => Member, { fieldName: 'ownerMemberId', nullable: true, ref: true })
  ownerMember?: Ref<Member>;
}

@Entity({ tableName: 'member' })
class Member {
  @PrimaryKey()
  id!: bigint;

  @OneToMany(() => User, user => user.ownerMember, { cascade: [Cascade.ALL] })
  ownedUsers = new Collection<User>(this);

  @OneToMany(() => MemberUser, 'member', { orphanRemoval: true })
  users = new Collection<MemberUser>(this);
}

@Entity({ tableName: 'member_user' })
class MemberUser {
  @PrimaryKey({ type: BigIntType })
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
      metadataProvider: ReflectMetadataProvider,
      entities: [User, Member, MemberUser],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  test('should properly cascade delete inside transaction', async () => {
    const user = orm.em.create(User, {});
    orm.em.persist(user);
    await orm.em.flush();

    const createdMember = orm.em.create(Member, {});
    orm.em.persist(createdMember);
    await orm.em.persist(createdMember).flush();

    const mu = orm.em.create(MemberUser, {
      member: createdMember.id,
      user: user.id,
    });
    await orm.em.persist(mu).flush();

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
