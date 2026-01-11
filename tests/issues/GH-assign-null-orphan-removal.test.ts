import { Entity, MikroORM, OneToOne, PrimaryKey, PrimaryKeyProp, Property, ref, Ref } from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name: string | null = null;

  @OneToOne('B', {
    mappedBy: 'a',
    nullable: true,
    ref: true,
    orphanRemoval: true,
  })
  b: Ref<B> | null = null;

}

@Entity()
class B {

  @OneToOne(() => A, {
    inversedBy: 'b',
    primary: true,
    ref: true,
  })
  a!: Ref<A>;

  [PrimaryKeyProp]?: 'a';

  @Property({ nullable: true })
  value: string | null = null;

}

describe('em.assign with null on 1:1 relation with orphanRemoval and primary FK', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  beforeEach(async () => {
    await orm.schema.refreshDatabase();
  });

  test('assigning null outside transaction', async () => {
    const em = orm.em.fork();

    const a = em.create(A, { name: 'a1' });
    em.create(B, { a: ref(a), value: 'b1' });
    await em.flush();
    const aId = a.id;
    em.clear();

    const loaded = await em.findOneOrFail(A, aId, { populate: ['b'] });
    expect(loaded.b).not.toBeNull();

    em.assign(loaded, { b: null });
    await em.flush();

    em.clear();
    const reloaded = await em.findOneOrFail(A, aId, { populate: ['b'] });
    expect(reloaded.b).toBeNull();
    expect(await em.count(B, {})).toBe(0);
  });

  test('assigning null inside transaction', async () => {
    const em = orm.em.fork();

    const a = em.create(A, { name: 'a1' });
    em.create(B, { a: ref(a), value: 'b1' });
    await em.flush();
    const aId = a.id;
    em.clear();

    await em.transactional(async txEm => {
      const loaded = await txEm.findOne(A, aId, { populate: ['b'] });
      expect(loaded).not.toBeNull();
      expect(loaded!.b).not.toBeNull();

      txEm.assign(loaded!, { b: null });
      await txEm.flush();
    });

    em.clear();
    const reloaded = await em.findOneOrFail(A, aId, { populate: ['b'] });
    expect(reloaded.b).toBeNull();
    expect(await em.count(B, {})).toBe(0);
  });

  test('directly setting null', async () => {
    const em = orm.em.fork();

    const a = em.create(A, { name: 'a1' });
    em.create(B, { a: ref(a), value: 'b1' });
    await em.flush();
    const aId = a.id;
    em.clear();

    const loaded = await em.findOneOrFail(A, aId, { populate: ['b'] });
    expect(loaded.b).not.toBeNull();

    loaded.b = null;
    await em.flush();

    em.clear();
    const reloaded = await em.findOneOrFail(A, aId, { populate: ['b'] });
    expect(reloaded.b).toBeNull();
    expect(await em.count(B, {})).toBe(0);
  });

});
