import { defineEntity, IDatabaseDriver, MikroORM, p, Utils } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { PLATFORMS } from '../bootstrap.js';

const OrganizationSchema = defineEntity({
  name: 'OrganizationEntity',
  properties: {
    id: p.uuid().primary(),
    name: p.string(),
  },
});
class OrganizationEntity extends OrganizationSchema.class {}
OrganizationSchema.setClass(OrganizationEntity);

const MeasurementTaskSchema = defineEntity({
  name: 'MeasurementTaskEntity',
  properties: {
    id: p.uuid().primary(),
    name: p.string(),
    sample: () => p.manyToOne(SampleSchema).ref(),
    measurementGroup: () => p.manyToOne(MeasurementGroupSchema).ref(),
  },
});
class MeasurementTaskEntity extends MeasurementTaskSchema.class {}
MeasurementTaskSchema.setClass(MeasurementTaskEntity);

const SampleSchema = defineEntity({
  name: 'SampleEntity',
  properties: {
    organization: () => p.manyToOne(OrganizationEntity).ref().primary(),
    id: p.uuid().primary(),
    name: p.string(),
    tasks: () => p.oneToMany(MeasurementTaskEntity).mappedBy(x => x.sample),
  },
  primaryKeys: ['organization', 'id'],
});
class SampleEntity extends SampleSchema.class {}
SampleSchema.setClass(SampleEntity);

const MeasurementGroupSchema = defineEntity({
  name: 'MeasurementGroupEntity',
  properties: {
    id: p.uuid().primary(),
    name: p.string(),
    beamtime: () => p.manyToOne(BeamtimeSchema).ref(),
  },
});
class MeasurementGroupEntity extends MeasurementGroupSchema.class {}
MeasurementGroupSchema.setClass(MeasurementGroupEntity);

const BeamtimeSchema = defineEntity({
  name: 'BeamtimeEntity',
  properties: {
    id: p.uuid().primary(),
    name: p.string(),
  },
});
class BeamtimeEntity extends BeamtimeSchema.class {}
BeamtimeSchema.setClass(BeamtimeEntity);

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_ghx31', port: 3308 },
  mariadb: { dbName: 'mikro_orm_ghx31', port: 3309 },
  postgresql: { dbName: 'mikro_orm_ghx31' },
  mssql: { dbName: 'mikro_orm_ghx31', password: 'Root.Root' },
  oracledb: {
    dbName: 'mikro_orm_ghx31',
    password: 'oracle123',
    schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' },
  },
};

describe.each(Utils.keys(options))('count with composite PK and toMany join [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [OrganizationEntity, SampleEntity, MeasurementTaskEntity, MeasurementGroupEntity, BeamtimeEntity],
      driver: PLATFORMS[type],
      allowGlobalContext: true,
      ...options[type],
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test('findByCursor with composite PK and deep relation filter', async () => {
    const samplesCursor = await orm.em.findByCursor(SampleEntity, {
      where: {
        tasks: {
          measurementGroup: {
            beamtime: {
              id: 'd2a3426f-6b79-4729-8793-589c5e922bae',
            },
          },
        },
      },
      orderBy: { id: 'ASC' },
    });

    expect(samplesCursor.items).toEqual([]);
  });

  test('findAndCount with composite PK and toMany filter', async () => {
    const org = orm.em.create(OrganizationEntity, { id: v4(), name: 'org1' });
    const beamtime = orm.em.create(BeamtimeEntity, { id: v4(), name: 'beamtime1' });
    const group = orm.em.create(MeasurementGroupEntity, { id: v4(), name: 'group1', beamtime });
    const sample1 = orm.em.create(SampleEntity, { organization: org, id: v4(), name: 'sample1' });
    const sample2 = orm.em.create(SampleEntity, { organization: org, id: v4(), name: 'sample2' });
    orm.em.create(MeasurementTaskEntity, { id: v4(), name: 'task1', sample: sample1, measurementGroup: group });
    orm.em.create(MeasurementTaskEntity, { id: v4(), name: 'task2', sample: sample1, measurementGroup: group });
    orm.em.create(MeasurementTaskEntity, { id: v4(), name: 'task3', sample: sample2, measurementGroup: group });
    await orm.em.flush();
    orm.em.clear();

    const [items, count] = await orm.em.findAndCount(
      SampleEntity,
      {
        tasks: { measurementGroup: { beamtime } },
      },
      { orderBy: { id: 'ASC' } },
    );

    expect(count).toBe(2);

    if (type !== 'oracledb') {
      expect(items).toHaveLength(2);
    }
  });
});
