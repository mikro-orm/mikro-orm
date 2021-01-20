import { Collection, Entity, Logger, ManyToOne, MikroORM, OneToMany, OneToOne, PrimaryKey, Property, Reference, wrap } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

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
export class License {

  @PrimaryKey()
  id!: number;

  @Property()
  expiresAt!: Date;

  @ManyToOne(() => Driver, { inversedBy: 'licenses', wrappedReference: true })
  driver!: Reference<Driver>;

  @ManyToOne('LicenseType', { inversedBy: 'licenses', wrappedReference: true })
  licenseType!: Reference<LicenseType>;

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


describe('GH issue 1326', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'mysql',
      dbName: `mikro_orm_test_gh_1326`,
      port: 3307,
      entities: [Driver, License, LicenseType],
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 1326`, async () => {
    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });

    const newDriver = new Driver();

    wrap(newDriver).assign({
      name: 'Martin Adámek',
      licenses: [{
        expiresAt: new Date(2050, 0, 1),
        licenseType: {
          name: 'Standard Driver License',
        },
      }],
    }, { em: orm.em });

    await orm.em.persistAndFlush(newDriver);
  });

});
