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
    const mu = orm.em.create(MemberUserMikro, {
      member: new MemberMikro(),
      user:  new UserMikro(),
    });

    await orm.em.persistAndFlush(mu);

    await orm.em.transactional(async em => {
      const member = await em.findOneOrFail(MemberMikro, mu.member.id, {
        populate: ['ownedUsers'],
      });

      member.ownedUsers.removeAll();

      em.remove(member);
    });
  });

});
