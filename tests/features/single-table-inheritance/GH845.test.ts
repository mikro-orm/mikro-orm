import { Entity, MikroORM, PrimaryKey, Property, OneToMany, ManyToOne, Collection, QueryOrder } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';
import { mockLogger } from '../../bootstrap';

abstract class Base {

  @PrimaryKey()
  id!: number;

}

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: {
    Child1: 'Child1',
    Child2: 'Child2',
  },
})
class Parent extends Base {

  @Property()
  type!: string;

  @OneToMany('Relation1', 'parent')
  qaInfo = new Collection<Relation1>(this);

}

@Entity()
class Relation1 extends Base {

  @ManyToOne('Parent')
  parent!: Parent;

}

@Entity()
class Child1 extends Parent {

  @OneToMany('Child1Specific', 'child1')
  rel = new Collection<Child1Specific>(this);

}

@Entity()
class Child1Specific extends Base {

  @ManyToOne()
  child1!: Child1;

}

@Entity()
class Child2 extends Parent {}

describe('GH issue 845', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Base, Relation1, Child1Specific, Child1, Child2, Parent],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 845`, async () => {
    const mock = mockLogger(orm, ['query']);

    expect(true).toBe(true);
    const c1 = new Child1();
    const c2 = new Child2();
    c1.rel.add(new Child1Specific());
    c1.rel.add(new Child1Specific());
    c1.rel.add(new Child1Specific());
    c2.qaInfo.add(new Relation1());
    c2.qaInfo.add(new Relation1());
    c2.qaInfo.add(new Relation1());
    await orm.em.persistAndFlush([c1, c2]);
    orm.em.clear();

    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `parent` (`type`) values (?), (?)');
    expect(mock.mock.calls[2][0]).toMatch('insert into `relation1` (`parent_id`) values (?), (?), (?)');
    expect(mock.mock.calls[3][0]).toMatch('insert into `child1specific` (`child1_id`) values (?), (?), (?)');
    expect(mock.mock.calls[4][0]).toMatch('commit');

    const parents = await orm.em.find(Parent, {}, {
      populate: ['qaInfo.parent', 'rel'] as never,
      orderBy: { type: QueryOrder.ASC },
    });
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

});
