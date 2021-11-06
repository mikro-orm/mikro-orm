/* eslint-disable @typescript-eslint/no-use-before-define */

import { Collection, Entity, Enum, Filter, ManyToMany, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property, QueryFlag, wrap } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SchemaGenerator } from '@mikro-orm/postgresql';


@Entity()
export class Group {

  @PrimaryKey()
  id: string;

  @Property()
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

}

@Entity()
export class User {

  @PrimaryKey()
  id: string;

  @Property({ length: 255 })
  name: string;

  @ManyToMany({ entity: () => Group, pivotTable: 'm2m_user_groups' })
  groups = new Collection<Group>(this);

  constructor(id: string, name: string, groups: Group[]) {
    this.id = id;
    this.name = name;
    this.groups.add(...groups);
  }

}

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

describe('GH issue 2095', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [C, T, TC, B, A, User, Group],
      dbName: 'mikro_orm_issue_2095',
      type: 'postgresql',
      // debug: true,
    });

    await new SchemaGenerator(orm.em).ensureDatabase();
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();


    const group1 = new Group('id-group-01', 'Group #1'); // RF
    const group2 = new Group('id-group-02', 'Group #2'); // admin
    const group3 = new Group('id-group-03', 'Group #3'); // everyone

    const user1 = new User('id-user-01', 'User #1', [group2]); // admin
    const user2 = new User('id-user-02', 'User #2', [group1, group3]);
    const user3 = new User('id-user-03', 'User #3', [group3]);

    await orm.em.persistAndFlush(user1);
    await orm.em.persistAndFlush(user2);
    await orm.em.persistAndFlush(user3);

    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('ordered query with limit/offset works', async () => {
    const enumValues = Object.values(Status);
    const c = orm.em.create(C, {});
    const cp = orm.em.create(C, {});

    const start = new Date(2020,0,1);
    const end = new Date(2021,0, 1);
    for (let i = 0; i < 50; i++) {
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


  test('getting users with limit 3. must be: [id-user-03, id-user-02, id-user-01]', async () => {
    const [ users, total ] = await orm.em.findAndCount(
      User,
      { groups: { $in: ['id-group-01', 'id-group-02', 'id-group-03'] } },
      { limit: 3, offset: 0, orderBy: { id: 'desc' }, flags: [QueryFlag.PAGINATE] },
    );
    expect(users).toHaveLength(3);
    expect(total).toBe(3);
    expect(users[0].id).toBe('id-user-03');
    expect(users[1].id).toBe('id-user-02');
    expect(users[2].id).toBe('id-user-01');
  });

  test('getting users with limit 2, offset 1. must be: [id-user-02, id-user-01]', async () => {
    const [ users, total ] = await orm.em.findAndCount(
      User,
      { groups: { $in: ['id-group-01', 'id-group-02', 'id-group-03'] } },
      { limit: 2, offset: 1, orderBy: { id: 'desc' }, flags: [QueryFlag.PAGINATE] },
    );
    expect(users).toHaveLength(2);
    expect(total).toBe(3);
    expect(users[0].id).toBe('id-user-02');
    expect(users[1].id).toBe('id-user-01');
  });

  test('getting users with limit 2, offset 0. must be: [id-user-03, id-user-02]', async () => {
    const [ users, total ] = await orm.em.findAndCount(
      User,
      { groups: { $in: ['id-group-01', 'id-group-02', 'id-group-03'] } },
      { limit: 2, offset: 0, orderBy: { id: 'desc' }, flags: [QueryFlag.PAGINATE] },
    );
    expect(users).toHaveLength(2);
    expect(total).toBe(3);
    expect(users[0].id).toBe('id-user-03');
    expect(users[1].id).toBe('id-user-02');
  });

  test('getting users with limit 2, offset 2. must be: [id-user-01]', async () => {
    const [ users, total ] = await orm.em.findAndCount(
      User,
      { groups: { $in: ['id-group-01', 'id-group-02', 'id-group-03'] } },
      { limit: 2, offset: 2, orderBy: { id: 'desc' }, flags: [QueryFlag.PAGINATE] },
    );
    expect(users).toHaveLength(1);
    expect(total).toBe(3);
    expect(users[0].id).toBe('id-user-01');
  });

});
