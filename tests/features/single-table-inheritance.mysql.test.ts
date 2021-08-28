import { Dictionary, Entity, Logger, MetadataDiscovery, MetadataStorage, MikroORM, PrimaryKey, Property, ReferenceType, wrap } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { BaseUser2, CompanyOwner2, Employee2, Manager2, Type } from '../entities-sql';
import { initORMMySql, wipeDatabaseMySql } from '../bootstrap';

describe('single table inheritance in mysql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  beforeEach(async () => wipeDatabaseMySql(orm.em));

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

    expect((owner as any).type).not.toBeDefined();
    await orm.em.persistAndFlush([owner, employee1]);
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

    const mock = jest.fn();
    const logger = new Logger(mock, true);
    Object.assign(orm.config, { logger });

    const managers = await orm.em.find(Manager2, {});
    expect(mock.mock.calls[0][0]).toMatch('select `e0`.* from `base_user2` as `e0` where `e0`.`type` in (\'manager\', \'owner\')');
    expect(managers.length).toBe(2);
    expect(managers.map(u => u.constructor.name)).toEqual(['Manager2', 'CompanyOwner2']);

    const owners = await orm.em.find(CompanyOwner2, {});
    expect(mock.mock.calls[1][0]).toMatch('select `e0`.* from `base_user2` as `e0` where `e0`.`type` = \'owner\'');
    expect(owners.length).toBe(1);
    expect(owners.map(u => u.constructor.name)).toEqual(['CompanyOwner2']);

    const employees = await orm.em.find(Employee2, {});
    expect(mock.mock.calls[2][0]).toMatch('select `e0`.* from `base_user2` as `e0` where `e0`.`type` = \'employee\'');
    expect(employees.length).toBe(2);
    expect(employees.map(u => u.constructor.name)).toEqual(['Employee2', 'Employee2']);

    const users = await orm.em.find(BaseUser2, {});
    expect(mock.mock.calls[3][0]).toMatch('select `e0`.* from `base_user2` as `e0`');
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
    expect(Object.keys(users[0])).toEqual(['id', 'firstName', 'lastName', 'type', 'employeeProp']);
    expect(Object.keys(users[1])).toEqual(['id', 'firstName', 'lastName', 'type', 'employeeProp']);
    expect(Object.keys(users[2])).toEqual(['id', 'firstName', 'lastName', 'type', 'managerProp']);
    expect(Object.keys(users[3])).toEqual(['id', 'firstName', 'lastName', 'type', 'ownerProp', 'favouriteEmployee', 'favouriteManager', 'managerProp']);

    expect([...orm.em.getUnitOfWork().getIdentityMap().keys()]).toEqual(['BaseUser2-4', 'BaseUser2-1', 'BaseUser2-2', 'BaseUser2-3']);

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
      type: 'sqlite',
      dbName: ':memory:',
    });
    const sql = await orm.getSchemaGenerator().getCreateSchemaSQL({ wrap: false });
    expect(sql).toMatchSnapshot();
    await orm.close(true);
  });

  afterAll(async () => orm.close(true));

});
