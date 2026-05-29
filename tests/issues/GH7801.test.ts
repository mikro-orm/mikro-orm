import { Ref, MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ManyToOne, Unique } from '@mikro-orm/decorators/legacy';

// `A` has a single (scalar) primary key, plus a composite unique key (x, y).
@Entity()
@Unique({ properties: ['x', 'y'] })
class A {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'number' })
  x!: number;

  @Property({ type: 'number' })
  y!: number;
}

// `B` references `A` through its composite unique key, so `a` has two field names
// even though the resolved target primary key of `A` is a single scalar.
@Entity()
class B {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @ManyToOne(() => A, { ref: true, joinColumns: ['a_x', 'a_y'], referencedColumnNames: ['x', 'y'] })
  a!: Ref<A>;

  @Property({ type: 'string' })
  name!: string;
}

@Entity()
class C {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @ManyToOne(() => B, { ref: true })
  b!: Ref<B>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [A, B, C],
    dbName: ':memory:',
  });
  await orm.schema.create();

  const conn = orm.em.getConnection();
  await conn.execute(`insert into a (id, x, y) values (1, 10, 20)`);
  await conn.execute(`insert into b (id, a_x, a_y, name) values (1, 10, 20, 'b')`);
  await conn.execute(`insert into c (id, b_id) values (1, 1)`);
});

afterAll(() => orm.close(true));

// `mapJoinedProp` takes the composite-key branch for `B.a` (two field names) but
// `mapFlatCompositePrimaryKey` collapses to a scalar (A's PK is single), so `pk.every` blew up.
test('joined load of a composite-FK relation whose target PK collapses to a scalar', async () => {
  const res = await orm.em.find(C, {}, { populate: ['b'], strategy: 'joined' });
  expect(res).toHaveLength(1);
  expect(res[0].b.unwrap().name).toBe('b');
});
