import { Collection, LoadStrategy, MikroORM, PopulateHint, Ref } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

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
    metadataProvider: ReflectMetadataProvider,
    forceUndefined: true,
    populateWhere: PopulateHint.INFER,
    loadStrategy: LoadStrategy.JOINED,
  });

  await orm.schema.refresh();

  const em = orm.em.fork();

  // Flush in stages so autoincrement IDs are predictable:
  // B gets id=1, A's get id=1,2, C's get id=1,2
  const b = em.create(B, { filterString: 'test' });
  await em.flush();

  const a1 = em.create(A, { bx: b });
  em.create(A, { bx: b });
  await em.flush();

  // C1 has no ax link, C2 links to A1.
  // This causes a PK coincidence: C2.id=2 matches A2.id=2, which triggered the bug.
  em.create(C, { bx: b });
  em.create(C, { bx: b, ax: a1 });
  await em.flush();
});

afterAll(async () => {
  await orm.close(true);
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
