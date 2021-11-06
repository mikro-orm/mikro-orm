import {
  Collection,
  Entity,
  IdentifiedReference,
  LoadStrategy,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  QueryOrder,
} from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class D {

  @PrimaryKey()
  id!: number;

  @Property()
  order!: number;

  @ManyToOne({
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    entity: () => C,
    wrappedReference: true,
  })
  c!: IdentifiedReference<C>;

}

@Entity()
export class C {

  @PrimaryKey()
  id!: number;

  @Property()
  order!: number;

  @ManyToOne({
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    entity: () => B,
    wrappedReference: true,
  })
  b!: IdentifiedReference<B>;

  @OneToMany(
    () => D,
    optionOption => optionOption.c,
    {
      eager: true,
      orderBy: { order: QueryOrder.ASC, id: QueryOrder.ASC },
    },
  )
  ds = new Collection<D>(this);

}

@Entity()
export class B {

  @PrimaryKey()
  id!: number;

  @Property()
  order!: number;

  @ManyToOne({
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    entity: () => A,
    wrappedReference: true,
  })
  a!: IdentifiedReference<A>;

  @OneToMany(
    () => C,
    option => option.b,
    {
      eager: true,
      orderBy: { order: QueryOrder.ASC, id: QueryOrder.ASC },
    },
  )
  cs = new Collection<C>(this);

}

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @OneToMany(
    () => B,
    radio => radio.a,
    {
      eager: true,
      orderBy: { order: QueryOrder.ASC, id: QueryOrder.ASC },
    },
  )
  bs = new Collection<B>(this);

}

describe('GH issue 1331', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [A, B, C, D],
      loadStrategy: LoadStrategy.JOINED,
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`relations' orderBy should be respectend when using LoadStrategy.JOINED`, async () => {
    const a = orm.em.create(A, {});
    const b1 = orm.em.create(B, { order: 0 });
    const b2 = orm.em.create(B, { order: 2 });
    const b3 = orm.em.create(B, { order: 1 });

    const c1 = orm.em.create(C, { order: 3 });
    const c2 = orm.em.create(C, { order: 4 });
    const c3 = orm.em.create(C, { order: 1 });

    c1.ds.add(orm.em.create(D, { order: 5 }));
    c1.ds.add(orm.em.create(D, { order: 2 }));
    c1.ds.add(orm.em.create(D, { order: 11 }));

    b1.cs.add(c1);
    b1.cs.add(c2);
    b1.cs.add(c3);

    b2.cs.add(orm.em.create(C, { order: 5 }));
    b2.cs.add(orm.em.create(C, { order: 2 }));
    b2.cs.add(orm.em.create(C, { order: 11 }));

    b3.cs.add(orm.em.create(C, { order: 0 }));
    b3.cs.add(orm.em.create(C, { order: 4 }));
    b3.cs.add(orm.em.create(C, { order: 1 }));

    a.bs.add(b1, b2, b3);

    await orm.em.persistAndFlush(a);
    orm.em.clear();

    const loadedA = await orm.em.findOneOrFail(A, a.id);
    expect(loadedA.bs.getItems().map(b => b.order)).toStrictEqual([0, 1, 2]);
    expect(loadedA.bs[0].cs.getIdentifiers('order')).toEqual([1,  3, 4]);
    expect(loadedA.bs[2].cs.getIdentifiers('order')).toEqual([2, 5, 11]);
    expect(loadedA.bs[1].cs.getIdentifiers('order')).toEqual([0, 1, 4]);
    expect(loadedA.bs[0].cs[1].ds.getIdentifiers('order')).toEqual([2, 5, 11]);
  });

});
