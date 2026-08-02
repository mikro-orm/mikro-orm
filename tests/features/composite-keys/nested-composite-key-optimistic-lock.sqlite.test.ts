import { MikroORM, OptimisticLockError, PrimaryKeyProp } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Bar {
  @PrimaryKey()
  id!: number;
}

@Entity()
class Baz {
  @PrimaryKey()
  id!: number;
}

@Entity()
class Param {
  [PrimaryKeyProp]?: ['bar', 'baz'];

  @ManyToOne(() => Bar, { primary: true })
  bar!: Bar;

  @ManyToOne(() => Baz, { primary: true })
  baz!: Baz;

  constructor(bar: Bar, baz: Baz) {
    this.bar = bar;
    this.baz = baz;
  }
}

@Entity()
class Detail {
  [PrimaryKeyProp]?: ['param', 'idx'];

  /** this FK spans two columns, so its value is a composite (array) primary key */
  @ManyToOne(() => Param, { primary: true })
  param!: Param;

  @PrimaryKey()
  idx!: number;

  @Property()
  value: string;

  @Property({ version: true })
  version!: Date;

  constructor(param: Param, idx: number, value: string) {
    this.param = param;
    this.idx = idx;
    this.value = value;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Bar, Baz, Param, Detail],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('batch update with optimistic locking on a nested composite key', async () => {
  const param = new Param(new Bar(), new Baz());
  const d1 = new Detail(param, 1, 'a');
  const d2 = new Detail(param, 2, 'b');
  await orm.em.persist([d1, d2]).flush();

  d1.value += ' changed!';
  d2.value += ' changed!';
  await orm.em.flush();

  // each update has to land on its own row, addressed via the nested composite key
  const rows = await orm.em.fork().find(Detail, { param }, { orderBy: { idx: 'asc' } });
  expect(rows.map(r => [r.idx, r.value])).toEqual([
    [1, 'a changed!'],
    [2, 'b changed!'],
  ]);

  // simulate a concurrent update so the optimistic lock check fails
  await orm.em.nativeUpdate(Detail, { idx: 2 }, { version: new Date('2020-01-01T00:00:00Z') });
  d1.value += '!';
  d2.value += '!';
  const err = await orm.em.flush().catch(e => e);
  expect(err).toBeInstanceOf(OptimisticLockError);
  // the reported entity has to be the one that was updated concurrently
  expect(err.getEntity()).toBe(d2);
});
