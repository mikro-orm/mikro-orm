import { Collection, Ref, LoadStrategy, MikroORM, OptionalProps, QueryOrder, raw } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class D {

  [OptionalProps]?: 'c';

  @PrimaryKey()
  id!: number;

  @Property()
  order!: number;

  @ManyToOne({
    entity: () => C,
    ref: true,
    nullable: true,
  })
  c?: Ref<C>;

}

@Entity()
export class C {

  @PrimaryKey()
  id!: number;

  @Property()
  order!: number;

  @Property()
  text!: string;

  @ManyToOne({
    entity: () => B,
    ref: true,
    nullable: true,
  })
  b?: Ref<B>;

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
    entity: () => A,
    ref: true,
    nullable: true,
  })
  a?: Ref<A>;

  @OneToMany(
    () => C,
    option => option.b,
    {
      eager: true,
      orderBy: [
        {
          order: QueryOrder.ASC,
          id: QueryOrder.ASC,
        },
        { [raw(a => `length(${a}.text)`)]: 'asc' },
      ],
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

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [A, B, C, D],
      loadStrategy: LoadStrategy.JOINED,
    });
    await orm.schema.create();

    const a = orm.em.create(A, { id: 1 });
    const b1 = orm.em.create(B, { order: 0 });
    const b2 = orm.em.create(B, { order: 2 });
    const b3 = orm.em.create(B, { order: 1 });

    const c1 = orm.em.create(C, { order: 3, text: 'text 3' });
    const c2 = orm.em.create(C, { order: 4, text: 'text 4' });
    const c3 = orm.em.create(C, { order: 1, text: 'text 1' });

    c1.ds.add(orm.em.create(D, { order: 5 }));
    c1.ds.add(orm.em.create(D, { order: 2 }));
    c1.ds.add(orm.em.create(D, { order: 11 }));

    b1.cs.add(c1);
    b1.cs.add(c2);
    b1.cs.add(c3);

    b2.cs.add(orm.em.create(C, { order: 5, text: 'text 5' }));
    b2.cs.add(orm.em.create(C, { order: 2, text: 'text 2' }));
    b2.cs.add(orm.em.create(C, { order: 11, text: 'text 11' }));

    b3.cs.add(orm.em.create(C, { order: 0, text: 'text 0' }));
    b3.cs.add(orm.em.create(C, { order: 4, text: 'text 4' }));
    b3.cs.add(orm.em.create(C, { order: 1, text: 'text 1' }));

    a.bs.add(b1, b2, b3);

    await orm.em.flush();
  });

  beforeEach(async () => {
    orm.em.clear();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`relations' orderBy should be respected when using LoadStrategy.JOINED`, async () => {
    const loadedA = await orm.em.findOneOrFail(A, 1);
    expect(loadedA.bs.getItems().map(b => b.order)).toStrictEqual([0, 1, 2]);
    expect(loadedA.bs[0].cs.getIdentifiers('order')).toEqual([1, 3, 4]);
    expect(loadedA.bs[2].cs.getIdentifiers('order')).toEqual([2, 5, 11]);
    expect(loadedA.bs[1].cs.getIdentifiers('order')).toEqual([0, 1, 4]);
    expect(loadedA.bs[0].cs[1].ds.getIdentifiers('order')).toEqual([2, 5, 11]);
    await orm.em.fork().findOneOrFail(A, 1);
    await orm.em.fork().findOneOrFail(A, 1);
  });

  test(`relations' orderBy should be respected when using LoadStrategy.SELECT_IN`, async () => {
    const loadedA = await orm.em.findOneOrFail(A, 1, { strategy: 'select-in' });
    expect(loadedA.bs.getItems().map(b => b.order)).toStrictEqual([0, 1, 2]);
    expect(loadedA.bs[0].cs.getIdentifiers('order')).toEqual([1, 3, 4]);
    expect(loadedA.bs[2].cs.getIdentifiers('order')).toEqual([2, 5, 11]);
    expect(loadedA.bs[1].cs.getIdentifiers('order')).toEqual([0, 1, 4]);
    expect(loadedA.bs[0].cs[1].ds.getIdentifiers('order')).toEqual([2, 5, 11]);
    await orm.em.fork().findOneOrFail(A, 1, { strategy: 'select-in' });
    await orm.em.fork().findOneOrFail(A, 1, { strategy: 'select-in' });
  });

});
