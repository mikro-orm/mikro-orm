import {
  Collection,
  Entity,
  Filter,
  LoadStrategy,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/core';
import type { AbstractSqlDriver, EntityManager } from '@mikro-orm/knex';
import { mockLogger } from '../../helpers';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
@Filter({
  name: 'isActive',
  cond: { active: true },
  default: true,
})
class BenefitDetail {

  @PrimaryKey()
  id!: number;

  @Property()
  description!: string;

  @ManyToOne(() => Benefit, { ref: true })
  benefit!: Ref<Benefit>;

  @Property()
  active: boolean = false;

}

@Filter({
  name: 'isActive',
  cond: { benefitStatus: 'A' },
  default: true,
})
class BaseBenefit {

  @PrimaryKey()
  id!: number;

  @Property()
  benefitStatus!: string;

}

@Entity()
class Benefit extends BaseBenefit {

  @Property({ nullable: true })
  name?: string;

  @OneToMany(() => BenefitDetail, d => d.benefit)
  details = new Collection<BenefitDetail>(this);

}

@Entity()
class Employee {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Benefit)
  benefits = new Collection<Benefit>(this);

}

@Entity()
@Filter({
  name: 'age',
  cond: { $or: [{ age: 18 }, { age: 21 }] },
  default: true,
})
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  firstName!: string;

  @Property()
  lastName!: string;

  @Property()
  age!: number;

}

@Entity()
@Filter({
  name: 'user',
  cond: (_args, _type, em: EntityManager) => ({ user: { $or: [{ firstName: 'name' }, { lastName: 'name' }, { age: em.raw('(select 1 + 1)') }] } }),
  default: true,
  args: false,
})
class Membership {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Property()
  role!: string;

}

describe('filters [postgres]', () => {

  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Employee, Benefit, User, Membership],
      dbName: `mikro_orm_test_gh_1232`,
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.em.createQueryBuilder(Employee).truncate().execute();
    await orm.em.createQueryBuilder(Benefit).truncate().execute();
  });

  afterAll(() => orm.close(true));

  test('get one employee with benefit status = A', async () => {
    const mock = mockLogger(orm, ['query']);

    const benefit = new Benefit();
    benefit.name = 'b1';
    benefit.benefitStatus = 'IA';
    const benefit2 = new Benefit();
    benefit2.name = 'b2';
    benefit2.benefitStatus = 'A';
    orm.em.assign(benefit, { details: [{ description: 'detail 11', active: true }, { description: 'detail 12', active: false }, { description: 'detail 13', active: true }] });
    orm.em.assign(benefit2, { details: [{ description: 'detail 21', active: false }, { description: 'detail 22', active: true }, { description: 'detail 23', active: false }] });
    const employee = new Employee();
    employee.benefits.add(benefit, benefit2);
    await orm.em.persistAndFlush(employee);
    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "employee" ("id") values (default) returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`insert into "benefit" ("benefit_status", "name") values ($1, $2), ($3, $4) returning "id"`);
    expect(mock.mock.calls[3][0]).toMatch(`insert into "benefit_detail" ("description", "benefit_id", "active") values ($1, $2, $3), ($4, $5, $6), ($7, $8, $9), ($10, $11, $12), ($13, $14, $15), ($16, $17, $18) returning "id", "active"`);
    expect(mock.mock.calls[4][0]).toMatch(`insert into "employee_benefits" ("employee_id", "benefit_id") values ($1, $2)`);
    expect(mock.mock.calls[5][0]).toMatch(`commit`);
    orm.em.clear();
    mock.mockReset();

    const b1 = await orm.em.find(Benefit, {});
    expect(b1).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".* from "benefit" as "b0" where "b0"."benefit_status" = $1`);
    orm.em.clear();
    mock.mockReset();

    const e1 = await orm.em.findOneOrFail(Employee, employee.id, { populate: ['benefits.details'] });
    expect(mock.mock.calls[0][0]).toMatch(`select "e0".* from "employee" as "e0" where "e0"."id" = $1 limit $2`);
    expect(mock.mock.calls[1][0]).toMatch(`select "b0".*, "e1"."benefit_id" as "fk__benefit_id", "e1"."employee_id" as "fk__employee_id" from "benefit" as "b0" left join "employee_benefits" as "e1" on "b0"."id" = "e1"."benefit_id" where "b0"."benefit_status" = $1 and "e1"."employee_id" in ($2)`);
    expect(mock.mock.calls[2][0]).toMatch(`select "b0".* from "benefit_detail" as "b0" where "b0"."active" = $1 and "b0"."benefit_id" in ($2) order by "b0"."benefit_id" asc`);
    expect(e1.benefits).toHaveLength(1);
    expect(e1.benefits[0].details).toHaveLength(1);

    orm.em.clear();
    mock.mockReset();

    const e2 = await orm.em.findOneOrFail(Employee, employee.id, { populate: ['benefits.details'], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls[0][0]).toMatch('select "e0"."id", "b1"."id" as "b1__id", "b1"."benefit_status" as "b1__benefit_status", "b1"."name" as "b1__name", "d3"."id" as "d3__id", "d3"."description" as "d3__description", "d3"."benefit_id" as "d3__benefit_id", "d3"."active" as "d3__active" ' +
        'from "employee" as "e0" ' +
        'left join "employee_benefits" as "e2" on "e0"."id" = "e2"."employee_id" ' +
        'left join "benefit" as "b1" on "e2"."benefit_id" = "b1"."id" and "b1"."benefit_status" = $1 ' +
        'left join "benefit_detail" as "d3" on "b1"."id" = "d3"."benefit_id" and "d3"."active" = $2 ' +
        'where "e0"."id" = $3');
    expect(e2.benefits).toHaveLength(1);
    expect(e2.benefits[0].details).toHaveLength(1);
  });

  test('merging $or conditions', async () => {
    const mock = mockLogger(orm, ['query']);

    await orm.em.find(User, { $or: [{ firstName: 'name' }, { lastName: 'name' }] });
    await orm.em.find(Membership, { $or: [{ role: 'admin' }, { role: 'moderator' }] });
    await orm.em.find(Membership, {
      $or: [
        { role: 'admin' },
        { role: 'moderator' },
      ],
      user: {
        $or: [
          { firstName: 'John' },
          { lastName: 'Doe' },
        ],
      },
    }, { filters: false });

    expect(mock.mock.calls[0][0]).toMatch(`select "u0".* from "user" as "u0" where ("u0"."age" = $1 or "u0"."age" = $2) and ("u0"."first_name" = $3 or "u0"."last_name" = $4)`);
    expect(mock.mock.calls[1][0]).toMatch(`select "m0".* from "membership" as "m0" left join "user" as "u1" on "m0"."user_id" = "u1"."id" where ("u1"."first_name" = $1 or "u1"."last_name" = $2 or "u1"."age" = (select 1 + 1)) and ("m0"."role" = $3 or "m0"."role" = $4)`);
    expect(mock.mock.calls[2][0]).toMatch(`select "m0".* from "membership" as "m0" left join "user" as "u1" on "m0"."user_id" = "u1"."id" where ("m0"."role" = $1 or "m0"."role" = $2) and ("u1"."first_name" = $3 or "u1"."last_name" = $4)`);
  });

});
