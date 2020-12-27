import {
  Collection,
  Entity,
  ManyToMany,
  MikroORM,
  PrimaryKey,
  Property,
  Filter,
  Logger,
} from '@mikro-orm/core';
import { AbstractSqlDriver, SchemaGenerator } from '@mikro-orm/knex';

@Entity()
@Filter({
  name: 'isActive',
  cond: () => ({
    benefitStatus: { $eq: 'A' },
  }),
  args: false,
  default: true,
})
class Benefit {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'text' })
  benefitStatus!: string;

}
@Entity()
class Employee {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => Benefit)
  public benefits?: Collection<Benefit> = new Collection<Benefit>(this);

}

describe('GH issue 1232', () => {
  let orm: MikroORM<AbstractSqlDriver>;
  const log = jest.fn();

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Employee, Benefit],
      dbName: `mikro_orm_test_gh_1232`,
      type: 'postgresql',
      cache: { enabled: false },
    });
    const logger = new Logger(log, ['query', 'query-params']);
    Object.assign(orm.config, { logger });
    await new SchemaGenerator(orm.em).ensureDatabase();
  });

  beforeEach(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('get one employee with benefit status = A', async () => {
    const benefit = new Benefit();
    benefit.benefitStatus = 'IA';
    const employee = new Employee();
    employee.benefits?.add(benefit);
    await orm.em.persistAndFlush(employee);

    expect(employee.id).toBeTruthy();
    const e1 = await orm.em.findOneOrFail(Employee, { id: employee.id });
    const b1 = await orm.em.find(Benefit, {});
    expect(b1).toHaveLength(0);
    expect(e1.benefits).toHaveLength(0);
  });
});
