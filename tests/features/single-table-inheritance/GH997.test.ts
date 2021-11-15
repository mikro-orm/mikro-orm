import { Entity, MikroORM, PrimaryKey, Property, OneToMany, ManyToOne, Collection, QueryOrder } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

abstract class Base {

  @PrimaryKey()
  id!: number;

}

@Entity({
  discriminatorColumn: 'type',
  abstract: true,
  tableName: 'parent_table',
})
class Parent extends Base {

  @Property()
  type!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => Relation1, e => e.parent)
  qaInfo = new Collection<Relation1>(this);

}

@Entity()
class Relation1 extends Base {

  @ManyToOne()
  parent!: Parent;

}

@Entity({ discriminatorValue: 'Child1' })
class Child1 extends Parent {

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => Child1Specific, e => e.child1)
  rel = new Collection<Child1Specific>(this);

}

@Entity()
class Child1Specific extends Base {

  @ManyToOne()
  child1!: Child1;

}

@Entity({ discriminatorValue: 'Child2' })
class Child2 extends Parent {
}

describe('GH issue 997', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Base, Relation1, Child1Specific, Parent, Child1, Child2],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 997`, async () => {
    // for unknown reason, for me setup from GH845.test.ts doesn't work,
    // complaining about default values for table columns,
    // so i tweaked it until it works
    const c1 = new Child1();
    const c2 = new Child2();
    await orm.em.persistAndFlush([c1, c2]);
    orm.em.clear();

    const [ci1, ci2]: [Child1, Child2] = await orm.em.find(Parent, {}, {
      populate: ['qaInfo.parent', 'rel'] as never,
      orderBy: { type: QueryOrder.ASC },
    }) as any;

    ci1.rel.add(new Child1Specific());
    ci1.rel.add(new Child1Specific());
    ci1.rel.add(new Child1Specific());
    ci2.qaInfo.add(new Relation1());
    ci2.qaInfo.add(new Relation1());
    ci2.qaInfo.add(new Relation1());

    await orm.em.persistAndFlush([ci1, ci2]);
    orm.em.clear();

    const results = await orm.em.createQueryBuilder(Parent)
      .offset(0)
      .limit(10)
      .orderBy({ type: QueryOrder.ASC })
      .getResult();

    const parents = await orm.em.populate(results as Child1[], ['qaInfo.parent', 'rel']);

    expect(parents[0]).toBeInstanceOf(Child1);
    expect(parents[0].type).toBe('Child1');
    expect(parents[0].qaInfo.length).toBe(0);
    expect((parents[0] as Child1).rel.length).toBe(3);
    expect((parents[0] as Child1).rel[0]).toBeInstanceOf(Child1Specific);
    expect((parents[0] as Child1).rel[0].child1).toBeInstanceOf(Child1);
    expect((parents[0] as Child1).rel[1]).toBeInstanceOf(Child1Specific);
    expect((parents[0] as Child1).rel[1].child1).toBeInstanceOf(Child1);
    expect((parents[0] as Child1).rel[2]).toBeInstanceOf(Child1Specific);
    expect((parents[0] as Child1).rel[2].child1).toBeInstanceOf(Child1);
    expect(parents[1]).toBeInstanceOf(Child2);
    expect(parents[1].type).toBe('Child2');
    expect(parents[1].qaInfo.length).toBe(3);
    expect(parents[1].qaInfo[0]).toBeInstanceOf(Relation1);
    expect(parents[1].qaInfo[0].parent).toBeInstanceOf(Child2);
    expect(parents[1].qaInfo[1]).toBeInstanceOf(Relation1);
    expect(parents[1].qaInfo[1].parent).toBeInstanceOf(Child2);
    expect(parents[1].qaInfo[2]).toBeInstanceOf(Relation1);
    expect(parents[1].qaInfo[2].parent).toBeInstanceOf(Child2);
    expect((parents[1] as Child1).rel).toBeUndefined();
  });

  test(`GH issue 2356`, async () => {
    await expect(orm.getSchemaGenerator().getCreateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
  });

});
