import type { Dictionary } from '@mikro-orm/core';
import { Entity, MetadataDiscovery, MetadataStorage, MikroORM, PrimaryKey, Property, ReferenceType, wrap, LoadStrategy } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { BaseUser2, Company2, CompanyOwner2, Employee2, Manager2, Type } from '../../entities-sql';
import { initORMMySql, mockLogger } from '../../bootstrap';
import { SqliteDriver } from '@mikro-orm/sqlite';

describe('single table inheritance in mysql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  async function createEntities() {
    const employee1 = new Employee2('Emp', '1');
    employee1.employeeProp = 1;
    const employee2 = new Employee2('Emp', '2');
    employee2.employeeProp = 2;
    const manager = new Manager2('Man', '3');
    manager.managerProp = 'i am manager';
    const owner = new CompanyOwner2('Bruce', 'Almighty');
    owner.ownerProp = 'i am owner';
    owner.managerProp = 'i said i am owner';
    owner.favouriteEmployee = employee2;
    owner.favouriteManager = manager;
    expect(Object.keys(owner)).not.toHaveLength(0);

    const company = new Company2('Com');
    company.employees.set([employee1, employee2]);
    company.managers.set([manager]);

    expect((owner as any).type).not.toBeDefined();
    await orm.em.persistAndFlush([owner, employee1, company]);
    orm.em.clear();

    // owner will be updated, as we first batch insert everything and handle the extra update for owner
    expect(owner.state).toBe('updated');
    expect(owner.baseState).toBe('updated');
    expect((owner as any).type).not.toBeDefined();
  }

  test('check metadata', async () => {
    expect(orm.getMetadata().get('CompanyOwner2').collection).toBe('base_user2');
    expect(orm.getMetadata().get('BaseUser2').hooks).toEqual({
      afterCreate: ['afterCreate1'],
      afterUpdate: ['afterUpdate1'],
    });
    expect(orm.getMetadata().get('Employee2').hooks).toEqual({
      afterCreate: ['afterCreate1'],
      afterUpdate: ['afterUpdate1'],
    });
    expect(orm.getMetadata().get('Manager2').hooks).toEqual({
      afterCreate: ['afterCreate1'],
      afterUpdate: ['afterUpdate1'],
    });
    expect(orm.getMetadata().get('CompanyOwner2').hooks).toEqual({
      afterCreate: ['afterCreate1', 'afterCreate2'],
      afterUpdate: ['afterUpdate1', 'afterUpdate2'],
    });
  });

  test('loading STI entities respects the entity type (GH #1252)', async () => {
    await createEntities();
    const mock = mockLogger(orm);

    const managers = await orm.em.find(Manager2, {});
    expect(mock.mock.calls[0][0]).toMatch('select `m0`.* from `base_user2` as `m0` where `m0`.`type` in (\'manager\', \'owner\')');
    expect(managers.length).toBe(2);
    expect(managers.map(u => u.constructor.name)).toEqual(['Manager2', 'CompanyOwner2']);

    const owners = await orm.em.find(CompanyOwner2, {});
    expect(mock.mock.calls[1][0]).toMatch('select `c0`.* from `base_user2` as `c0` where `c0`.`type` = \'owner\'');
    expect(owners.length).toBe(1);
    expect(owners.map(u => u.constructor.name)).toEqual(['CompanyOwner2']);

    const employees = await orm.em.find(Employee2, {});
    expect(mock.mock.calls[2][0]).toMatch('select `e0`.* from `base_user2` as `e0` where `e0`.`type` = \'employee\'');
    expect(employees.length).toBe(2);
    expect(employees.map(u => u.constructor.name)).toEqual(['Employee2', 'Employee2']);

    const users = await orm.em.find(BaseUser2, {});
    expect(mock.mock.calls[3][0]).toMatch('select `b0`.* from `base_user2` as `b0`');
    expect(users.length).toBe(4);
    expect(users.map(u => u.constructor.name).sort()).toEqual(['CompanyOwner2', 'Employee2', 'Employee2', 'Manager2']);
  });

  test('persisting and loading STI entities', async () => {
    await createEntities();
    const users = await orm.em.find(BaseUser2, {}, { orderBy: { lastName: 'asc', firstName: 'asc' } });
    expect(users).toHaveLength(4);
    expect(users[0]).toBeInstanceOf(Employee2);
    expect(users[1]).toBeInstanceOf(Employee2);
    expect(users[2]).toBeInstanceOf(Manager2);
    expect(users[3]).toBeInstanceOf(CompanyOwner2);
    expect((users[3] as CompanyOwner2).favouriteEmployee).toBeInstanceOf(Employee2);
    expect((users[3] as CompanyOwner2).favouriteManager).toBeInstanceOf(Manager2);
    expect(users[0]).toMatchObject({
      id: 4,
      firstName: 'Emp',
      lastName: '1',
      employeeProp: 1,
      type: Type.Employee,
    });
    expect(users[1]).toMatchObject({
      id: 1,
      firstName: 'Emp',
      lastName: '2',
      employeeProp: 2,
      type: Type.Employee,
    });
    expect(users[2]).toMatchObject({
      id: 2,
      firstName: 'Man',
      lastName: '3',
      managerProp: 'i am manager',
      type: Type.Manager,
    });
    expect(users[3]).toMatchObject({
      id: 3,
      firstName: 'Bruce',
      lastName: 'Almighty',
      managerProp: 'i said i am owner',
      ownerProp: 'i am owner',
      favouriteEmployee: users[1],
      favouriteManager: users[2],
      type: Type.Owner,
    });
    expect(Object.keys(users[0])).toEqual(['id', 'firstName', 'lastName', 'company', 'type', 'employeeProp']);
    expect(Object.keys(users[1])).toEqual(['id', 'firstName', 'lastName', 'company', 'type', 'employeeProp']);
    expect(Object.keys(users[2])).toEqual(['id', 'firstName', 'lastName', 'company', 'type', 'managerProp']);
    expect(Object.keys(users[3])).toEqual(['id', 'firstName', 'lastName', 'company', 'type', 'ownerProp', 'favouriteEmployee', 'favouriteManager', 'managerProp']);

    expect([...orm.em.getUnitOfWork().getIdentityMap().keys()]).toEqual(['BaseUser2-4', 'BaseUser2-1', 'BaseUser2-2', 'BaseUser2-3', 'Company2-1']);

    const o = await orm.em.findOneOrFail(CompanyOwner2, 3);
    expect(o.state).toBeUndefined();
    expect(o.baseState).toBeUndefined();
    o.firstName = 'Changed';
    delete o.favouriteEmployee;
    await orm.em.flush();
    expect(o.state).toBe('updated');
    expect(o.baseState).toBe('updated');
    orm.em.clear();

    const users2 = await orm.em.find(BaseUser2, { type: Type.Employee }, { orderBy: { lastName: 'asc', firstName: 'asc' } });
    expect(users2.map(u => [u.type, u.lastName])).toEqual([[Type.Employee, '1'], [Type.Employee, '2']]);
  });

  test('generated discriminator column', async () => {
    const meta = orm.getMetadata().get(BaseUser2.name);
    const prop = meta.properties[meta.discriminatorColumn!];
    await createEntities();
    prop.userDefined = false;
    const users = await orm.em.find(BaseUser2, { type: Type.Employee }, { orderBy: { lastName: 'asc', firstName: 'asc' } });
    expect(users.map(u => [u.type, u.lastName])).toEqual([[undefined, '1'], [undefined, '2']]);
    prop.userDefined = undefined; // revert back
  });

  test('STI in m:1 and 1:1 relations', async () => {
    await createEntities();
    const owner = await orm.em.findOneOrFail(CompanyOwner2, { firstName: 'Bruce' });
    expect(owner).toBeInstanceOf(CompanyOwner2);
    expect(owner.favouriteEmployee).toBeInstanceOf(Employee2);
    expect(wrap(owner.favouriteEmployee).isInitialized()).toBe(false);
    await wrap(owner.favouriteEmployee).init();
    expect(wrap(owner.favouriteEmployee).isInitialized()).toBe(true);
    expect(owner.favouriteManager).toBeInstanceOf(Manager2);
    expect(wrap(owner.favouriteManager).isInitialized()).toBe(false);
    await wrap(owner.favouriteManager).init();
    expect(wrap(owner.favouriteManager).isInitialized()).toBe(true);
  });

  test('loading base type with discriminator condition', async () => {
    await createEntities();
    const users = await orm.em.find(Manager2, {});
    expect(users).toHaveLength(2);
    expect(users[0]).toBeInstanceOf(Manager2);
    expect(users[1]).toBeInstanceOf(CompanyOwner2);
  });

  test('generated discriminator map', async () => {
    const storage = new MetadataStorage({
      A: { name: 'A', className: 'A', primaryKeys: ['id'], discriminatorColumn: 'type', properties: { id: { name: 'id', type: 'string', reference: ReferenceType.SCALAR } } },
      B: { name: 'B', className: 'B', primaryKeys: ['id'], extends: 'A', properties: { id: { name: 'id', type: 'string', reference: ReferenceType.SCALAR } } },
      C: { name: 'C', className: 'C', primaryKeys: ['id'], extends: 'A', properties: { id: { name: 'id', type: 'string', reference: ReferenceType.SCALAR } } },
    } as Dictionary);
    class A {

      toJSON(a: string, b: string) {
        //
      }

    }
    class B {}
    class C {}
    orm.config.set('entities', [A, B, C]);
    orm.config.set('entitiesTs', [A, B, C]);
    const discovery = new MetadataDiscovery(storage, orm.em.getDriver().getPlatform(), orm.config);
    const discovered = await discovery.discover();
    expect(discovered.get('A').discriminatorMap).toEqual({ a: 'A', b: 'B', c: 'C' });
    expect(discovered.get('A').properties.type).toMatchObject({
      name: 'type',
      enum: true,
      type: 'string',
      index: true,
      items: ['a', 'b', 'c'],
    });
    expect(discovered.get('A').discriminatorValue).toBe('a');
    expect(discovered.get('B').discriminatorValue).toBe('b');
    expect(discovered.get('C').discriminatorValue).toBe('c');
  });

  test('non-abstract root entity', async () => {
    @Entity({
      discriminatorColumn: 'type',
      discriminatorMap: {
        person: 'Person',
        employee: 'Employee',
      },
    })
    class Person {

      @PrimaryKey()
      id!: string;

    }

    @Entity()
    class Employee extends Person {

      @Property()
      number?: number;

    }

    const orm = await MikroORM.init({
      entities: [Person, Employee],
      driver: SqliteDriver,
      dbName: ':memory:',
    });
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot();
    await orm.close(true);
  });

  test('STI in joined populate field and FilterQuery', async () => {
    await createEntities();
    const mock = mockLogger(orm);

    const company = await orm.em.findOne(Company2, { name: 'Com' }, { populate: ['employees'], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls[0][0]).toMatch("select `c0`.`id`, `c0`.`name`, `e1`.`id` as `e1__id`, `e1`.`first_name` as `e1__first_name`, `e1`.`last_name` as `e1__last_name`, `e1`.`company_id` as `e1__company_id`, `e1`.`type` as `e1__type`, `e1`.`owner_prop` as `e1__owner_prop`, `e1`.`favourite_employee_id` as `e1__favourite_employee_id`, `e1`.`favourite_manager_id` as `e1__favourite_manager_id`, `e1`.`employee_prop` as `e1__employee_prop`, `e1`.`manager_prop` as `e1__manager_prop` from `company2` as `c0` left join `base_user2` as `e1` on `c0`.`id` = `e1`.`company_id` where `c0`.`name` = 'Com' and `e1`.`type` = 'employee'");
    expect(company!.employees.length).toBe(2);
    expect(company!.employees.getItems().map(u => u.firstName)).toEqual(['Emp', 'Emp']);

    const company2 = await orm.em.findOne(Company2, { name: 'Com' }, { populate: ['managers'], strategy: LoadStrategy.JOINED });
    expect(mock.mock.calls[1][0]).toMatch("select `c0`.`id`, `c0`.`name`, `m1`.`id` as `m1__id`, `m1`.`first_name` as `m1__first_name`, `m1`.`last_name` as `m1__last_name`, `m1`.`company_id` as `m1__company_id`, `m1`.`type` as `m1__type`, `m1`.`owner_prop` as `m1__owner_prop`, `m1`.`favourite_employee_id` as `m1__favourite_employee_id`, `m1`.`favourite_manager_id` as `m1__favourite_manager_id`, `m1`.`employee_prop` as `m1__employee_prop`, `m1`.`manager_prop` as `m1__manager_prop` from `company2` as `c0` left join `base_user2` as `m1` on `c0`.`id` = `m1`.`company_id` where `c0`.`name` = 'Com' and `m1`.`type` in ('manager', 'owner')");
    expect(company2!.managers.length).toBe(1);
    expect(company2!.managers.getItems().map(u => u.firstName)).toEqual(['Man']);

    await orm.em.findOne(Company2, { name: 'Com', managers: { firstName: 'Man' } });
    expect(mock.mock.calls[2][0]).toMatch("select `c0`.* from `company2` as `c0` left join `base_user2` as `m1` on `c0`.`id` = `m1`.`company_id` where `c0`.`name` = 'Com' and `m1`.`first_name` = 'Man' and `m1`.`type` in ('manager', 'owner') limit 1");

    const company3 = await orm.em.findOne(Company2, { name: 'Com', $and: [
      { managers: { firstName: 'Man' } },
      { employees: { firstName: 'Emp' } },
    ] });
    expect(mock.mock.calls[3][0]).toMatch("select `c0`.* from `company2` as `c0` left join `base_user2` as `m1` on `c0`.`id` = `m1`.`company_id` left join `base_user2` as `e2` on `c0`.`id` = `e2`.`company_id` where `c0`.`name` = 'Com' and `m1`.`first_name` = 'Man' and `m1`.`type` in ('manager', 'owner') and `e2`.`first_name` = 'Emp' and `e2`.`type` = 'employee' limit 1");
    expect(company3?.name).toEqual('Com');

    const company4 = await orm.em.findOne(Company2, { name: 'Com', $and: [
      { managers: { firstName: 'Man' } },
      { employees: { firstName: 'Man' } },
    ] });
    expect(mock.mock.calls[4][0]).toMatch("select `c0`.* from `company2` as `c0` left join `base_user2` as `m1` on `c0`.`id` = `m1`.`company_id` left join `base_user2` as `e2` on `c0`.`id` = `e2`.`company_id` where `c0`.`name` = 'Com' and `m1`.`first_name` = 'Man' and `m1`.`type` in ('manager', 'owner') and `e2`.`first_name` = 'Man' and `e2`.`type` = 'employee' limit 1");
    expect(company4).toEqual(null);

    await orm.em.findOne(Company2, { name: 'Com', employees: { firstName: 'Emp' } }, {
      populate: ['employees', 'managers'],
      strategy: LoadStrategy.JOINED,
    });
    expect(mock.mock.calls[5][0]).toMatch("select `c0`.`id`, `c0`.`name`, `e1`.`id` as `e1__id`, `e1`.`first_name` as `e1__first_name`, `e1`.`last_name` as `e1__last_name`, `e1`.`company_id` as `e1__company_id`, `e1`.`type` as `e1__type`, `e1`.`owner_prop` as `e1__owner_prop`, `e1`.`favourite_employee_id` as `e1__favourite_employee_id`, `e1`.`favourite_manager_id` as `e1__favourite_manager_id`, `e1`.`employee_prop` as `e1__employee_prop`, `e1`.`manager_prop` as `e1__manager_prop`, `m2`.`id` as `m2__id`, `m2`.`first_name` as `m2__first_name`, `m2`.`last_name` as `m2__last_name`, `m2`.`company_id` as `m2__company_id`, `m2`.`type` as `m2__type`, `m2`.`owner_prop` as `m2__owner_prop`, `m2`.`favourite_employee_id` as `m2__favourite_employee_id`, `m2`.`favourite_manager_id` as `m2__favourite_manager_id`, `m2`.`employee_prop` as `m2__employee_prop`, `m2`.`manager_prop` as `m2__manager_prop` from `company2` as `c0` left join `base_user2` as `e1` on `c0`.`id` = `e1`.`company_id` left join `base_user2` as `m2` on `c0`.`id` = `m2`.`company_id` where `c0`.`name` = 'Com' and `e1`.`first_name` = 'Emp' and `e1`.`type` = 'employee' and `m2`.`type` in ('manager', 'owner')");
  });

});
