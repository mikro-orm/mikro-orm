import {
  Entity,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

export abstract class BaseMikro {

  @PrimaryKey()
  id!: number;

}

@Entity({ tableName: 'member' })
export class Member extends BaseMikro {}

@Entity({
  discriminatorColumn: 'type',
  tableName: 'member_relationship',
  abstract: true,
})
export abstract class MemberRelationship extends BaseMikro {

  [OptionalProps]?: 'type';

  @Property({ type: String })
  type!: string;

  @Property({ type: String })
  data!: string;

}

@Entity({ discriminatorValue: 'one' })
export abstract class MemberRelationshipOne extends MemberRelationship {

  @ManyToOne(() => Member, { fieldName: 'activeId', ref: true })
  activeOne!: Ref<Member>;

  @ManyToOne(() => Member, { fieldName: 'passiveId', ref: true })
  passive!: Ref<Member>;

}

@Entity({ discriminatorValue: 'two' })
export abstract class MemberRelationshipTwo extends MemberRelationship {

  @ManyToOne(() => Member, { fieldName: 'activeId', ref: true })
  activeTwo!: Ref<Member>;

  @ManyToOne(() => Member, { fieldName: 'passiveId', ref: true })
  passive!: Ref<Member>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [
      BaseMikro,
      Member,
      MemberRelationship,
      MemberRelationshipOne,
      MemberRelationshipTwo,
    ],
    dbName: ':memory:',
  });

  await orm.em
    .getConnection()
    .execute('create table member (id integer primary key autoincrement);');
  await orm.em
    .getConnection()
    .execute(
      'create table member_relationship (id integer primary key autoincrement, activeId text, passiveId text, type text, data text);',
    );
});

afterAll(() => orm.close(true));

test('should not delete active id when mutating entity', async () => {
  const fork1 = orm.em.fork();

  const member1 = fork1.create(Member, {});
  const member2 = fork1.create(Member, {});
  const rel = fork1.create(MemberRelationshipOne, {
    activeOne: member1,
    passive: member2,
    data: 'foo',
  });

  await fork1.flush();

  // this will cause activeId to be set to null
  await orm.em.transactional(async tx => {
    const loaded = await tx.findOneOrFail(MemberRelationshipOne, rel.id);

    expect(loaded.passive).toBeTruthy();
    expect(loaded.activeOne).toBeTruthy();

    loaded.data = 'bar';
  });

  const fork2 = orm.em.fork();

  const loaded = await fork2.findOneOrFail(MemberRelationshipOne, rel.id);

  expect(loaded.passive).toBeTruthy();
  expect(loaded.activeOne).toBeTruthy();
});

test('should support creating two different relationships in the same transaction', async () => {
  const fork1 = orm.em.fork();

  const member1 = fork1.create(Member, {});
  const member2 = fork1.create(Member, {});

  fork1.create(MemberRelationshipOne, {
    activeOne: member1,
    passive: member2,
    data: 'foo',
  });

  fork1.create(MemberRelationshipTwo, {
    activeTwo: member1,
    passive: member2,
    data: 'bar',
  });

  await fork1.flush();
});
