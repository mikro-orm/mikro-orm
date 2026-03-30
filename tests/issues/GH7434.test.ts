import {
  Collection,
  Entity,
  LoadStrategy,
  ManyToOne,
  MikroORM,
  OneToMany,
  OneToOne,
  PopulateHint,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @OneToOne(() => C, c => c.ax, { nullable: true, ref: true })
  cx?: Ref<C>;

  @ManyToOne(() => B, { ref: true })
  bx!: Ref<B>;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property()
  filterString!: string;

  @OneToMany(() => A, e => e.bx)
  axs = new Collection<A>(this);

  @OneToMany({
    entity: () => C,
    mappedBy: c => c.bx,
    nullable: true,
    ref: true,
  })
  cx = new Collection<C>(this);

}

@Entity()
class C {

  @PrimaryKey()
  id!: number;

  @OneToOne({ entity: () => A, ref: true, nullable: true, owner: true })
  ax?: Ref<A>;

  @ManyToOne({ entity: () => B, ref: true })
  bx!: Ref<B>;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [A, B, C],
    forceUndefined: true,
    populateWhere: PopulateHint.INFER,
    loadStrategy: LoadStrategy.JOINED,
  });

  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
  const em = orm.em.fork();
  const b = em.create(B, { id: 1, filterString: 'test' });

  const a = em.create(A, { id: 1, bx: b });
  em.create(A, { id: 2, bx: b });

  // C entities created in reverse ID order — C2 (with ax=A1) before C1 (without ax).
  // This causes a PK coincidence: C2.id=2 matches A2.id=2, which triggered the bug.
  em.create(C, { id: 2, bx: b, ax: a });
  em.create(C, { id: 1, bx: b });

  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7434 - nullifies stale 1:1 inverse reference on refresh', async () => {
  const em = orm.em.fork();

  // Load A1 with cx populated — A1.cx = C2 in identity map
  const a1 = await em.findOneOrFail(A, 1, { populate: ['cx'] });
  expect(a1.cx).toBeDefined();

  // Delete C2 directly in DB, bypassing the ORM
  await em.getConnection().execute('delete from `c` where `id` = 2');

  // Re-populate via em.populate with refresh — uses SELECT_IN for the inner query,
  // so A1.cx retains the stale C2 reference until the null-out logic clears it.
  await em.populate(a1, ['cx'], { refresh: true });
  expect(a1.cx).toBeUndefined();
});

test('GH #7434 - query with crossed relation works', async () => {
  const em = orm.em.fork();
  const loadedAllAs = await em.find(
    A,
    {},
    {
      populate: ['cx', 'bx.cx'],
    },
  );

  expect(loadedAllAs).toHaveLength(2);
  expect(loadedAllAs.find(x => x.id === 1)!.cx).toBeDefined();
  expect(loadedAllAs.find(x => x.id === 1)!.bx.$.cx.$.length).toEqual(2);
  expect(loadedAllAs.find(x => x.id === 2)!.cx).toBeUndefined();
});
