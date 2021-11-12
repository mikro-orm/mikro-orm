import {
  BigIntType, Cascade, Collection,
  Entity,
  IdentifiedReference,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
} from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity({ tableName: 'user' })
class UserMikro {

  @PrimaryKey({ type: BigIntType, fieldName: 'id' })
  id!: number;

  @ManyToOne('MemberMikro', { fieldName: 'ownerMemberId', wrappedReference: true, nullable: true })
  ownerMember?: IdentifiedReference<MemberMikro>;

}

@Entity({ tableName: 'member' })
class MemberMikro {

  @PrimaryKey({ type: BigIntType, fieldName: 'id' })
  id!: number;

  @OneToMany(() => UserMikro, user => user.ownerMember, { cascade: [Cascade.ALL] })
  ownedUsers = new Collection<UserMikro>(this);

  @OneToMany('MemberUserMikro', 'member', { orphanRemoval: true })
  users = new Collection<MemberUserMikro>(this);

}

@Entity({ tableName: 'member_user' })
class MemberUserMikro {

  @PrimaryKey({ type: BigIntType, fieldName: 'id' })
  id!: number;

  @ManyToOne(() => MemberMikro, { fieldName: 'memberId', wrappedReference: true })
  member!: IdentifiedReference<MemberMikro>;

  @ManyToOne(() => UserMikro, { fieldName: 'userId', wrappedReference: true })
  user?: IdentifiedReference<UserMikro>;

}

describe('GH issue 2410', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [UserMikro, MemberMikro, MemberUserMikro],
      dbName: 'mikro_orm_test_2410',
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('should properly cascade delete inside transaction', async () => {
    const user = orm.em.create(UserMikro, {});
    orm.em.persist(user);

    await orm.em.flush();

    const createdMember = orm.em.create(MemberMikro, {});
    orm.em.persist(createdMember);

    await orm.em.persistAndFlush(createdMember);

    const mu = orm.em.create(MemberUserMikro, {
      member: createdMember.id,
      user: user.id,
    });

    await orm.em.persistAndFlush(mu);

    await orm.em.transactional(async tx => {
      const member = await tx.findOne(MemberMikro, createdMember.id, {
        populate: ['ownedUsers'],
      });

      if (member) {
        member.users.removeAll();

        tx.remove(member);
      }
    });
  });

});
