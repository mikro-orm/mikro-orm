import {
  Collection,
  Entity,
  Filter,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Ref,
  sql,
} from '@mikro-orm/core';
import type { AbstractSqlDriver } from '@mikro-orm/knex';
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
  cond: () => ({ user: { $or: [{ firstName: 'name' }, { lastName: 'name' }, { age: sql`(select ${1} + ${1})` }] } }),
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
    await orm.schema.clearDatabase();
  });

  afterAll(() => orm.close(true));

  async function createEntities(active?: boolean) {
    const benefit = new Benefit();
    benefit.name = 'b1';
    benefit.benefitStatus = 'IA';
    const benefit2 = new Benefit();
    benefit2.name = 'b2';
    benefit2.benefitStatus = 'A';
    orm.em.assign(benefit, {
      details: [
        { description: 'detail 11', active: active ?? true },
        { description: 'detail 12', active: active ?? false },
        { description: 'detail 13', active: active ?? true },
      ],
    });
    orm.em.assign(benefit2, {
      details: [
        { description: 'detail 21', active: active ?? false },
        { description: 'detail 22', active: active ?? true },
        { description: 'detail 23', active: active ?? false },
      ],
    });
    const employee = new Employee();
    employee.benefits.add(benefit, benefit2);
    await orm.em.persistAndFlush(employee);
    orm.em.clear();

    return { employee };
  }

  test('get one employee with benefit status = A', async () => {
    const mock = mockLogger(orm, ['query']);
    const { employee } = await createEntities();
    expect(mock.mock.calls[0][0]).toMatch(`begin`);
    expect(mock.mock.calls[1][0]).toMatch(`insert into "employee" ("id") values (default) returning "id"`);
    expect(mock.mock.calls[2][0]).toMatch(`insert into "benefit" ("benefit_status", "name") values (?, ?), (?, ?) returning "id"`);
    expect(mock.mock.calls[3][0]).toMatch(`insert into "benefit_detail" ("description", "benefit_id", "active") values (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?) returning "id"`);
    expect(mock.mock.calls[4][0]).toMatch(`insert into "employee_benefits" ("benefit_id", "employee_id") values (?, ?), (?, ?)`);
    expect(mock.mock.calls[5][0]).toMatch(`commit`);
    orm.em.clear();
    mock.mockReset();

    const qb = orm.em.qb(Benefit);
    await qb.applyFilters();
    const b1 = await qb;
    expect(b1).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".* from "benefit" as "b0" where "b0"."benefit_status" = ?`);
    orm.em.clear();
    mock.mockReset();

    const e1 = await orm.em.findOneOrFail(Employee, employee.id, { populate: ['benefits.details'], strategy: 'select-in' });
    expect(mock.mock.calls[0][0]).toMatch(`select "e0".* from "employee" as "e0" where "e0"."id" = ? limit ?`);
    expect(mock.mock.calls[1][0]).toMatch(`select "b1".*, "e0"."benefit_id" as "fk__benefit_id", "e0"."employee_id" as "fk__employee_id" from "employee_benefits" as "e0" inner join "benefit" as "b1" on "e0"."benefit_id" = "b1"."id" where "b1"."benefit_status" = ? and "e0"."employee_id" in (?)`);
    expect(mock.mock.calls[2][0]).toMatch(`select "b0".*, "b1"."id" as "b1__id" from "benefit_detail" as "b0" inner join "benefit" as "b1" on "b0"."benefit_id" = "b1"."id" and "b1"."benefit_status" = ? where "b0"."active" = ? and "b0"."benefit_id" in (?)`);
    expect(e1.benefits).toHaveLength(1);
    expect(e1.benefits[0].details).toHaveLength(1);

    orm.em.clear();
    mock.mockReset();

    const e2 = await orm.em.findOneOrFail(Employee, employee.id, { populate: ['benefits.details'], strategy: 'joined' });
    expect(mock.mock.calls[0][0]).toMatch('select "e0".*, "b1"."id" as "b1__id", "b1"."benefit_status" as "b1__benefit_status", "b1"."name" as "b1__name", "d3"."id" as "d3__id", "d3"."description" as "d3__description", "d3"."benefit_id" as "d3__benefit_id", "d3"."active" as "d3__active" ' +
      'from "employee" as "e0" ' +
      'left join "employee_benefits" as "e2" on "e0"."id" = "e2"."employee_id" ' +
      'left join "benefit" as "b1" on "e2"."benefit_id" = "b1"."id" and "b1"."benefit_status" = ? ' +
      'left join "benefit_detail" as "d3" on "b1"."id" = "d3"."benefit_id" and "d3"."active" = ? ' +
      'where "e0"."id" = ?');
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

    expect(mock.mock.calls[0][0]).toMatch(`select "u0".* from "user" as "u0" where ("u0"."age" = ? or "u0"."age" = ?) and ("u0"."first_name" = ? or "u0"."last_name" = ?)`);
    expect(mock.mock.calls[1][0]).toMatch(`select "m0".*, "u1"."id" as "u1__id" from "membership" as "m0" inner join "user" as "u1" on "m0"."user_id" = "u1"."id" and ("u1"."age" = ? or "u1"."age" = ?) where ("u1"."first_name" = ? or "u1"."last_name" = ? or "u1"."age" = ?) and ("m0"."role" = ? or "m0"."role" = ?)`);
    expect(mock.mock.calls[2][0]).toMatch(`select "m0".* from "membership" as "m0" left join "user" as "u1" on "m0"."user_id" = "u1"."id" where ("m0"."role" = ? or "m0"."role" = ?) and ("u1"."first_name" = ? or "u1"."last_name" = ?)`);
  });

  test('Ref.load() allows controlling filters', async () => {
    await createEntities();

    const mock = mockLogger(orm, ['query']);
    const details = await orm.em.findAll(BenefitDetail, {
      filters: false,
      where: { active: false },
    });
    expect(details).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".* from "benefit_detail" as "b0" where "b0"."active" = ?`);
    expect(details[0].benefit.isInitialized()).toBe(false);
    await expect(details[0].benefit.load()).resolves.toBe(null);
    await expect(details[0].benefit.loadOrFail()).rejects.toThrow('Benefit not found (1)');
    await expect(details[0].benefit.load({ filters: false })).resolves.toMatchObject({
      id: 1,
      name: 'b1',
      benefitStatus: 'IA',
    });
  });

  test('eager joined filter on relation', async () => {
    await createEntities();

    const mock = mockLogger(orm, ['query']);
    const details1 = await orm.em.findAll(BenefitDetail, { strategy: 'select-in' });
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".*, "b1"."id" as "b1__id" from "benefit_detail" as "b0" inner join "benefit" as "b1" on "b0"."benefit_id" = "b1"."id" and "b1"."benefit_status" = ? where "b0"."active" = ?`);
    expect(details1).toHaveLength(1);
    await expect(details1[0].benefit.load()).resolves.toMatchObject({
      id: details1[0].benefit.id,
      benefitStatus: 'A',
      name: 'b2',
    });

    mock.mockReset();
    const details2 = await orm.em.findAll(BenefitDetail);
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".*, "b1"."id" as "b1__id" from "benefit_detail" as "b0" inner join "benefit" as "b1" on "b0"."benefit_id" = "b1"."id" and "b1"."benefit_status" = ? where "b0"."active" = ?`);
    expect(details2).toHaveLength(1);
    await expect(details2[0].benefit.load()).resolves.toMatchObject({
      id: details2[0].benefit.id,
      benefitStatus: 'A',
      name: 'b2',
    });

    mock.mockReset();
    const details3 = await orm.em.findAll(BenefitDetail, { filters: false });
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".* from "benefit_detail" as "b0"`);
    expect(details3).toHaveLength(6);
    expect(details3[0].benefit.id).toBe(1);
    await expect(details3[0].benefit.load()).resolves.toBe(null);
    await expect(details3[0].benefit.load({ filters: false })).resolves.toMatchObject({
      id: details3[0].benefit.id,
      benefitStatus: 'IA',
      name: 'b1',
    });
  });

  test('Collection.load() allows controlling filters', async () => {
    await createEntities(false);

    const mock = mockLogger(orm, ['query']);
    const benefits = await orm.em.findAll(Benefit, {
      filters: false,
      where: { details: { active: false } },
    });
    expect(benefits).toHaveLength(2);
    expect(mock.mock.calls[0][0]).toMatch(`select "b0".* from "benefit" as "b0" left join "benefit_detail" as "b1" on "b0"."id" = "b1"."benefit_id" where "b1"."active" = ?`);
    expect(benefits[0].details.isInitialized()).toBe(false);
    await expect(benefits[0].details.loadItems()).resolves.toHaveLength(0);
    expect(mock.mock.calls[1][0]).toMatch(`select "b0".*, "b1"."id" as "b1__id" from "benefit_detail" as "b0" inner join "benefit" as "b1" on "b0"."benefit_id" = "b1"."id" and "b1"."benefit_status" = ? where "b0"."active" = ? and "b0"."benefit_id" in (?)`);
    await expect(benefits[0].details.loadItems({ filters: false, refresh: true })).resolves.toHaveLength(3);
    expect(mock.mock.calls[2][0]).toMatch(`select "b0".* from "benefit_detail" as "b0" where "b0"."benefit_id" in (?)`);
  });

});
