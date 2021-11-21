import { Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { mockLogger } from '../helpers';

@Entity()
export class Driver {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany('License', 'driver')
  licenses = new Collection<License>(this);

}

@Entity()
export class LicenseType {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @OneToMany('License', 'licenseType')
  licenses = new Collection<License>(this);

}

@Entity()
export class License {

  @PrimaryKey()
  id!: number;

  @Property()
  expiresAt!: Date;

  @ManyToOne(() => Driver, { inversedBy: 'licenses', wrappedReference: true })
  driver!: IdentifiedReference<Driver>;

  @ManyToOne('LicenseType', { inversedBy: 'licenses', wrappedReference: true })
  licenseType!: IdentifiedReference<LicenseType>;

}

describe('GH issue 1326', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'mysql',
      dbName: `mikro_orm_test_gh_1326`,
      port: 3307,
      entities: [Driver, License, LicenseType],
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`em.create()`, async () => {
    orm.em.clear();
    const newDriver = orm.em.create(Driver, {
      name: 'Martin Adámek',
      licenses: [{
        expiresAt: new Date(2050, 0, 1),
        licenseType: {
          name: 'Standard Driver License',
        },
      }],
    });
    const mock = mockLogger(orm, ['query']);
    await orm.em.persistAndFlush(newDriver);
    expect(mock.mock.calls).toHaveLength(5);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `license_type` (`name`) values (?)');
    expect(mock.mock.calls[2][0]).toMatch('insert into `driver` (`name`) values (?)');
    expect(mock.mock.calls[3][0]).toMatch('insert into `license` (`driver_id`, `expires_at`, `license_type_id`) values (?, ?, ?)');
    expect(mock.mock.calls[4][0]).toMatch('commit');
    expect(newDriver.id).toBeDefined();
    expect(newDriver.licenses[0].id).toBeDefined();
    expect(newDriver.licenses[0].licenseType.id).toBeDefined();
  });

  test(`em.assign()`, async () => {
    orm.em.clear();
    const newDriver = new Driver();
    orm.em.assign(newDriver, {
      name: 'Martin Adámek',
      licenses: [{
        expiresAt: new Date(2050, 0, 1),
        licenseType: {
          name: 'Standard Driver License',
        },
      }],
    });
    const mock = mockLogger(orm, ['query']);
    await orm.em.persistAndFlush(newDriver);
    expect(mock.mock.calls).toHaveLength(5);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `license_type` (`name`) values (?)');
    expect(mock.mock.calls[2][0]).toMatch('insert into `driver` (`name`) values (?)');
    expect(mock.mock.calls[3][0]).toMatch('insert into `license` (`driver_id`, `expires_at`, `license_type_id`) values (?, ?, ?)');
    expect(mock.mock.calls[4][0]).toMatch('commit');
    expect(newDriver.id).toBeDefined();
    expect(newDriver.licenses[0].id).toBeDefined();
    expect(newDriver.licenses[0].licenseType.id).toBeDefined();
  });

});
