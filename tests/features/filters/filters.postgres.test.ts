import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property, Filter, Logger } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';

@Entity()
@Filter({
  name: 'isActive',
  cond: { benefitStatus: 'A' },
  default: true,
})
class Benefit {

  @PrimaryKey()
  id!: number;

  @Property()
  benefitStatus!: string;

}

@Entity()
class Employee {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Benefit)
  benefits = new Collection<Benefit>(this);

}

describe('filters [postgres]', () => {

  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Employee, Benefit],
      dbName: `mikro_orm_test_gh_1232`,
      type: 'postgresql',
      debug: true,
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  beforeEach(async () => {
    await orm.em.createQueryBuilder(Employee).truncate().execute();
    await orm.em.createQueryBuilder(Benefit).truncate().execute();
  });

  afterAll(() => orm.close(true));

  test('get one employee with benefit status = A', async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const benefit = new Benefit();
    benefit.benefitStatus = 'IA';
    const employee = new Employee();
    employee.benefits.add(benefit);
    await orm.em.persistAndFlush(employee);
    orm.em.clear();

    const b1 = await orm.em.find(Benefit, {});
    expect(b1).toHaveLength(0);
    orm.em.clear();

    const e1 = await orm.em.findOneOrFail(Employee, employee.id, ['benefits']);
    expect(e1.benefits).toHaveLength(0);

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "employee" default values returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`insert into "benefit" ("benefit_status") values ($1) returning "id"`);
    expect(mock.mock.calls[3][0]).toMatch(`insert into "employee_benefits" ("employee_id", "benefit_id") values ($1, $2)`);
    expect(mock.mock.calls[4][0]).toMatch(`commit`);
    expect(mock.mock.calls[5][0]).toMatch(`select "e0".* from "benefit" as "e0" where "e0"."benefit_status" = $1`);
    expect(mock.mock.calls[6][0]).toMatch(`select "e0".* from "employee" as "e0" where "e0"."id" = $1 limit $2`);
    expect(mock.mock.calls[7][0]).toMatch(`select "e0".*, "e1"."benefit_id" as "fk__benefit_id", "e1"."employee_id" as "fk__employee_id" from "benefit" as "e0" left join "employee_benefits" as "e1" on "e0"."id" = "e1"."benefit_id" where "e0"."benefit_status" = $1 and "e1"."employee_id" in ($2)`);
  });

});
