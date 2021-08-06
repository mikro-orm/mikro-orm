import { Collection, ConstraintViolationException, Entity, Enum, Filter, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property, QueryFlag, wrap } from '@mikro-orm/core';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { PostgreSqlDriver } from '../../packages/postgresql/src';

enum Status {
  LIVE = 'LIVE',
  DRAFT = 'DRAFT',
  CLOSED = 'CLOSED'
}

@Entity()
export class C {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => TC, b => b.c)
  tc = new Collection<TC>(this);

  @OneToMany(() => T, b => b.init)
  t = new Collection<T>(this);

  @OneToMany(() => B, b => b.sub, { nullable: true })
  bs? = new Collection<B>(this);

}

@Filter({
  name: 'vis',
  cond: (args, type) => {
      return {
          $or: [
              {
                init: args.u.c.id,
              },
              {
                  init: {
                      $ne: args.u.c.id,
                  },
                  tc: { c: args.u.c.id },
                  status: [Status.LIVE, Status.CLOSED],
              },
          ],
      };
  },
  default: true,
})
@Entity()
export class T {

  @PrimaryKey()
  id!: number;

  @Property()
  end!: Date;

  @Enum(() => Status)
  status!: Status;

  @ManyToOne(() => C)
  init!: C;

  @OneToMany(() => TC, b => b.t)
  tc = new Collection<TC>(this);

}


@Entity()
export class TC {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => C)
  c!: C;

  @ManyToOne(() => T)
  t!: T;

  @OneToMany(() => A, a => a.tc, { eager: true })
  as? = new Collection<A>(this);

}

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => TC, {
      nullable: false,
      onDelete: 'cascade',
  })
  tc!: TC;

  @OneToOne(() => B, undefined, {
      nullable: true,
      inversedBy: b => b.a,
      onDelete: 'set null',
      eager: true,
  })
  b?: any;

}


@Entity()
export class B {

    @PrimaryKey()
    id!: number;

    @ManyToOne(() => C)
    sub!: C;

    @OneToOne(() => A, a => a.b, { nullable: true, onDelete: 'set null' })
    a?: A;

}


describe('GH issue 222', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [C, T, TC, B, A],
      dbName: 'glx',
      host: 'localhost',
      user: 'glx',
      password: 'glx',
      type: 'postgresql',
      // debug: true
    });
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(() => orm.close(true));

  test('ordered query with limit/offset works', async () => {
    const enumValues = Object.values(Status);
    const c = orm.em.create(C, {});
    const cp = orm.em.create(C, {});

    const start = new Date(2020,0,1);
    const end = new Date(2021,0, 1);
    for (let i = 0; i < 200; i++) {
      const tc = orm.em.create(TC, { c: cp });
      const t = orm.em.create(T, {
        end: new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
        status: enumValues[Math.floor(Math.random()*enumValues.length)],
        init: c,
        tc: [tc],
      });

      for (let j = 0; j < 5; j++) {
        const a = orm.em.create(A, {
          tc,
          b: orm.em.create(B, { sub: cp }),
        });
        tc.as?.add(a);
      }

      for (let j = 0; j < 5; j++) {
        const a = orm.em.create(A, {
          tc,
          b: orm.em.create(B, { sub: c }),
        });
        tc.as?.add(a);
      }
      orm.em.persist(t);
    }

    await orm.em.flush();

    orm.em.clear();

    orm.em.setFilterParams('vis', { u:{ c:{ id: c.id } } });

    const firstResults = await orm.em.find(T, {}, {
      limit: 20,
      orderBy: { end: 'ASC' },
      populate: ['tc.c'],
      flags: [QueryFlag.PAGINATE],
    });

    orm.em.clear();

    const secondResults = await orm.em.find(T, {
    }, {
      limit: 20,
      offset: 20,
      orderBy: { end: 'ASC' },
      populate: ['tc.c'],
      flags: [QueryFlag.PAGINATE],
    });

    const firstMaxDate = new Date(Math.max(...firstResults.map(e => e.end.getTime())));
    const secondMinDate = new Date(Math.min(...secondResults.map(e => e.end.getTime())));

    expect(firstResults.length).toBe(20);
    expect(secondResults.length).toBe(20);
    expect(firstMaxDate.getTime()).toBeLessThan(secondMinDate.getTime());
  });

});
