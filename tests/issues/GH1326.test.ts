import { Collection, Entity, Ref, MikroORM, ManyToOne, OneToMany, PrimaryKey, Property } from '@mikro-orm/mysql';
import { mockLogger } from '../helpers.js';

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

  @ManyToOne(() => Driver, { inversedBy: 'licenses', ref: true })
  driver!: Ref<Driver>;

  @ManyToOne('LicenseType', { inversedBy: 'licenses', ref: true })
  licenseType!: Ref<LicenseType>;

}

describe('GH issue 1326', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: `mikro_orm_test_gh_1326`,
      port: 3308,
      entities: [Driver, License, LicenseType],
    });
    await orm.schema.refreshDatabase();
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
    expect(mock.mock.calls[3][0]).toMatch('insert into `license` (`expires_at`, `driver_id`, `license_type_id`) values (?, ?, ?)');
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
    expect(mock.mock.calls[3][0]).toMatch('insert into `license` (`expires_at`, `driver_id`, `license_type_id`) values (?, ?, ?)');
    expect(mock.mock.calls[4][0]).toMatch('commit');
    expect(newDriver.id).toBeDefined();
    expect(newDriver.licenses[0].id).toBeDefined();
    expect(newDriver.licenses[0].licenseType.id).toBeDefined();
  });

});
