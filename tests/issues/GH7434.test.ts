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
    debug: true,
  });

  await orm.schema.createSchema();

  const em = orm.em.fork();
  const b = em.create(B, { id: 1, filterString: 'test' });

  // A
  const a = em.create(A, { id: 1, bx: b });
  em.create(A, { id: 2, bx: b });

  // Create C - Intentionally create them in reverse order - as the id on the first one will cause the a to not be populated
  // If they were flipped (the first one had id = 1 it would work as a.id = 1 also)
  em.create(C, { id: 2, bx: b, ax: a });
  em.create(C, { id: 1, bx: b });

  await em.flush();
  em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7434 - query with crossed relation works', async () => {
  const loadedAllAs = await orm.em.find(
    A,
    {},
    {
      populate: ['cx', 'bx.cx'],
    },
  );

  // A1 should have cx, A2 should not
  expect(loadedAllAs).toHaveLength(2);
  expect(loadedAllAs.find(x => x.id === 1)!.cx).toBeDefined();
  expect(loadedAllAs.find(x => x.id === 1)!.bx.$.cx.$.length).toEqual(2);
  expect(loadedAllAs.find(x => x.id === 2)!.cx).toBeUndefined();
});
