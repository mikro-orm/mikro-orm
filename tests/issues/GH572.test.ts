import { unlinkSync } from 'fs';
import { Entity, IdentifiedReference, Logger, MikroORM, OneToOne, PrimaryKey, Property, QueryOrder, ReflectMetadataProvider } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { BASE_DIR } from '../bootstrap';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @OneToOne('B', 'a', { wrappedReference: true })
  b!: IdentifiedReference<B>;

}

@Entity()
export class B {

  @PrimaryKey()
  id!: number;

  @Property()
  camelCaseField?: string;

  @OneToOne('A', 'b', { owner: true, wrappedReference: true })
  a!: IdentifiedReference<A>;

}

describe('GH issue 572', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: BASE_DIR + '/../temp/mikro_orm_test_gh572.db',
      type: 'sqlite',
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
      highlight: false,
    });
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test(`GH issue 572`, async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });
    const res1 = await orm.em.find(A, {}, {
      orderBy: { b: { camelCaseField: QueryOrder.ASC } },
      populate: ['b'],
    });
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.*, `e1`.`id` as `b_id` from `a` as `e0` left join `b` as `e1` on `e0`.`id` = `e1`.`a_id` order by `e1`.`camel_case_field` asc');
    expect(res1).toHaveLength(0);
    const qb1 = await orm.em.createQueryBuilder(A, 'a').select('a.*').orderBy({ b: { camelCaseField: QueryOrder.ASC } });
    expect(qb1.getQuery()).toMatch('select `a`.* from `a` as `a` left join `b` as `e1` on `a`.`id` = `e1`.`a_id` order by `e1`.`camel_case_field` asc');
    const qb2 = await orm.em.createQueryBuilder(B, 'b').select('b.*').orderBy({ 'b.camelCaseField': QueryOrder.ASC });
    expect(qb2.getQuery()).toMatch('select `b`.* from `b` as `b` order by `b`.`camel_case_field` asc');
    const qb3 = await orm.em.createQueryBuilder(A, 'a').select('a.*').leftJoin('a.b', 'b_').orderBy({ 'b_.camelCaseField': QueryOrder.ASC });
    expect(qb3.getQuery()).toMatch('select `a`.* from `a` as `a` left join `b` as `b_` on `a`.`id` = `b_`.`a_id` order by `b_`.`camel_case_field` asc');
  });
});
