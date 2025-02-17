import { Entity, Ref, MikroORM, OneToOne, PrimaryKey, Property, QueryOrder } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @OneToOne('B', 'a', { ref: true })
  b!: Ref<B>;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property()
  camelCaseField?: string;

  @OneToOne('A', 'b', { owner: true, ref: true })
  a!: Ref<A>;

}

describe('GH issue 572', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 572`, async () => {
    const mock = mockLogger(orm, ['query']);
    const res1 = await orm.em.find(A, {}, {
      orderBy: { b: { camelCaseField: QueryOrder.ASC } },
      populate: ['b'],
    });
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`id` as `b1__id`, `b1`.`camel_case_field` as `b1__camel_case_field`, `b1`.`a_id` as `b1__a_id` from `a` as `a0` left join `b` as `b1` on `a0`.`id` = `b1`.`a_id` order by `b1`.`camel_case_field` asc');
    expect(res1).toHaveLength(0);
    const qb1 = orm.em.createQueryBuilder(A, 'a').select('a.*').orderBy({ b: { camelCaseField: QueryOrder.ASC } });
    expect(qb1.getQuery()).toMatch('select `a`.* from `a` as `a` left join `b` as `b1` on `a`.`id` = `b1`.`a_id` order by `b1`.`camel_case_field` asc');
    const qb2 = orm.em.createQueryBuilder(B, 'b').select('b.*').orderBy({ 'b.camelCaseField': QueryOrder.ASC });
    expect(qb2.getQuery()).toMatch('select `b`.* from `b` as `b` order by `b`.`camel_case_field` asc');
    const qb3 = orm.em.createQueryBuilder(A, 'a').select('a.*').leftJoin('a.b', 'b_').orderBy({ 'b_.camelCaseField': QueryOrder.ASC });
    expect(qb3.getQuery()).toMatch('select `a`.* from `a` as `a` left join `b` as `b_` on `a`.`id` = `b_`.`a_id` order by `b_`.`camel_case_field` asc');
  });
});
