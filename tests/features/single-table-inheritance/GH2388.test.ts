import { OptionalProps, Ref } from '@mikro-orm/core';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

abstract class BaseMikro {
  @PrimaryKey()
  id!: number;
}

@Entity({ tableName: 'member' })
class Member extends BaseMikro {}

@Entity({
  discriminatorColumn: 'type',
  tableName: 'member_relationship',
  abstract: true,
})
abstract class MemberRelationship extends BaseMikro {
  [OptionalProps]?: 'type';

  @Property()
  type!: string;

  @Property()
  data!: string;
}

@Entity({ discriminatorValue: 'one' })
class MemberRelationshipOne extends MemberRelationship {
  @ManyToOne(() => Member, { fieldName: 'activeId', ref: true })
  activeOne!: Ref<Member>;

  @ManyToOne(() => Member, { fieldName: 'passiveId', ref: true })
  passive!: Ref<Member>;
}

@Entity({ discriminatorValue: 'two' })
class MemberRelationshipTwo extends MemberRelationship {
  @ManyToOne(() => Member, { fieldName: 'activeId', ref: true })
  activeTwo!: Ref<Member>;

  @ManyToOne(() => Member, { fieldName: 'passiveId', ref: true })
  passive!: Ref<Member>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [BaseMikro, Member, MemberRelationship, MemberRelationshipOne, MemberRelationshipTwo],
    dbName: ':memory:',
  });

  await orm.schema.create();
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

  const loaded = await orm.em.fork().findOneOrFail(MemberRelationshipOne, rel.id);

  expect(loaded.passive).toBeTruthy();
  expect(loaded.activeOne).toBeTruthy();
});

test('should support creating two different relationships in the same transaction', async () => {
  const member1 = orm.em.create(Member, {});
  const member2 = orm.em.create(Member, {});

  const rel1 = orm.em.create(MemberRelationshipOne, {
    activeOne: member1,
    passive: member2,
    data: 'foo',
  });

  const rel2 = orm.em.create(MemberRelationshipTwo, {
    activeTwo: member1,
    passive: member2,
    data: 'bar',
  });

  await orm.em.flush();

  rel1.data = 'foo1';
  rel2.data = 'bar2';

  await orm.em.flush();
  orm.em.clear();

  const rels = await orm.em.find(MemberRelationship, { data: ['foo1', 'bar2'] }, { orderBy: { id: 'asc' } });
  expect(rels[0].data).toBe('foo1');
  expect(rels[0]).toBeInstanceOf(MemberRelationshipOne);
  expect(rels[1].data).toBe('bar2');
  expect(rels[1]).toBeInstanceOf(MemberRelationshipTwo);
});
