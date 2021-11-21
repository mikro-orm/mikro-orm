import { Collection, Entity, ManyToMany, MikroORM, PrimaryKey, Property, Filter, ManyToOne } from '@mikro-orm/core';
import type { AbstractSqlDriver, EntityManager } from '@mikro-orm/knex';
import { mockLogger } from '../../helpers';

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
      type: 'postgresql',
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
    const mock = mockLogger(orm, ['query']);

    const benefit = new Benefit();
    benefit.benefitStatus = 'IA';
    const employee = new Employee();
    employee.benefits.add(benefit);
    await orm.em.persistAndFlush(employee);
    orm.em.clear();

    const b1 = await orm.em.find(Benefit, {});
    expect(b1).toHaveLength(0);
    orm.em.clear();

    const e1 = await orm.em.findOneOrFail(Employee, employee.id, { populate: ['benefits'] });
    expect(e1.benefits).toHaveLength(0);

    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "employee" default values returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`insert into "benefit" ("benefit_status") values ($1) returning "id"`);
    expect(mock.mock.calls[3][0]).toMatch(`insert into "employee_benefits" ("employee_id", "benefit_id") values ($1, $2)`);
    expect(mock.mock.calls[4][0]).toMatch(`commit`);
    expect(mock.mock.calls[5][0]).toMatch(`select "b0".* from "benefit" as "b0" where "b0"."benefit_status" = $1`);
    expect(mock.mock.calls[6][0]).toMatch(`select "e0".* from "employee" as "e0" where "e0"."id" = $1 limit $2`);
    expect(mock.mock.calls[7][0]).toMatch(`select "b0".*, "e1"."benefit_id" as "fk__benefit_id", "e1"."employee_id" as "fk__employee_id" from "benefit" as "b0" left join "employee_benefits" as "e1" on "b0"."id" = "e1"."benefit_id" where "b0"."benefit_status" = $1 and "e1"."employee_id" in ($2)`);
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
