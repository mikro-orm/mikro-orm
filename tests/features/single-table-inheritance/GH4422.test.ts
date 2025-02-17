import {
  Collection,
  Entity,
  Enum,
  ManyToMany,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  Property,
  Ref,
  wrap,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../bootstrap.js';

@Entity()
class Company {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Employee, employee => employee.company)
  employees = new Collection<Employee>(this);

  @OneToMany(() => Manager, manager => manager.company)
  managers = new Collection<Manager>(this);

  // this one is not owner
  @ManyToMany(() => Tag1, tag => tag.companies)
  tags1 = new Collection<Tag1>(this);

  // this one is owner
  @ManyToMany(() => Tag2, tag => tag.companies, { owner: true })
  tags2 = new Collection<Tag2>(this);

}

@Entity({
  discriminatorColumn: 'type',
  abstract: true,
})
class Tag {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Enum()
  type!: 'tag1' | 'tag2';

}

@Entity({ discriminatorValue: 'tag1' })
class Tag1 extends Tag {

  @ManyToMany(() => Company, company => company.tags1, {
    owner: true,
  })
  companies = new Collection<Tag>(this);

}

@Entity({ discriminatorValue: 'tag2' })
class Tag2 extends Tag {

  @ManyToMany(() => Company, company => company.tags2)
  companies = new Collection<Tag>(this);

}

@Entity({
  discriminatorColumn: 'type',
  abstract: true,
})
class User {

  @PrimaryKey({ type: Number })
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Company, { ref: true })
  company!: Ref<Company>;

  @Enum()
  type!: 'employee' | 'manager';

}

@Entity({ discriminatorValue: 'employee' })
class Employee extends User {

  @ManyToOne(() => Manager, { ref: true, nullable: true })
  manager?: Ref<Manager>;

}

@Entity({ discriminatorValue: 'manager' })
class Manager extends User {

  @OneToMany(() => Employee, employee => employee.manager)
  employees = new Collection<Employee>(this);

}

describe('GH issue 4422', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Company, User, Employee, Manager, Tag],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();

    const tag1 = new Tag1();
    tag1.name = 'tag1';

    const tag2 = new Tag2();
    tag2.name = 'tag2';

    const company1 = new Company();
    company1.name = 'company1';
    company1.tags1.set([tag1]);
    company1.tags2.set([tag2]);

    const manager1 = new Manager();
    manager1.company = wrap(company1).toReference();
    manager1.name = 'manager1';

    const employee = new Employee();
    employee.company = wrap(company1).toReference();
    employee.manager = wrap(manager1).toReference();
    employee.name = 'employee';

    await orm.em.persistAndFlush([employee]);
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('Many to many owner', async () => {
    const mock = mockLogger(orm);

    await orm.em.find(Company, {
      tags1: {
        name: 'tag1',
      },
    });
    expect(mock.mock.calls[0][0]).toMatch(
      "select `c0`.* from `company` as `c0` left join `tag_companies` as `t2` on `c0`.`id` = `t2`.`company_id` left join `tag` as `t1` on `t2`.`tag_id` = `t1`.`id` and `t1`.`type` = 'tag1' where `t1`.`name` = 'tag1'",
    );
  });

  test('Many to many not owner', async () => {
    const mock = mockLogger(orm);

    await orm.em.find(Company, {
      tags2: {
        name: 'tag2',
      },
    });
    expect(mock.mock.calls[0][0]).toMatch(
      "select `c0`.* from `company` as `c0` left join `company_tags2` as `c2` on `c0`.`id` = `c2`.`company_id` left join `tag` as `c1` on `c2`.`tag_id` = `c1`.`id` and `c1`.`type` = 'tag2' where `c1`.`name` = 'tag2'",
    );
  });

  test('Many to one', async () => {
    const mock = mockLogger(orm);

    await orm.em.find(Employee, {
      manager: {
        name: 'manager1',
      },
    });
    expect(mock.mock.calls[0][0]).toMatch(
      "select `e0`.* from `user` as `e0` left join `user` as `m1` on `e0`.`manager_id` = `m1`.`id` and `m1`.`type` = 'manager' where `m1`.`name` = 'manager1' and `e0`.`type` = 'employee'",
    );
  });

  test('One to many', async () => {
    const mock = mockLogger(orm);

    await orm.em.find(Company, {
      employees: {
        name: 'employee',
      },
    });
    expect(mock.mock.calls[0][0]).toMatch(
      "select `c0`.* from `company` as `c0` left join `user` as `e1` on `c0`.`id` = `e1`.`company_id` and `e1`.`type` = 'employee' where `e1`.`name` = 'employee'",
    );
  });
});
