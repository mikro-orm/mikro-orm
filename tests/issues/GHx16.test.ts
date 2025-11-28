import { Collection, MikroORM } from '@mikro-orm/sqlite';

import { Entity, Filter, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Filter({ name: 'softDelete', cond: { removedAt: null }, default: true })
@Entity()
class MicroCloud {

  @PrimaryKey()
  id!: number;

  @Property({ length: 6, nullable: true })
  removedAt?: Date;

}

@Entity()
class DatacenterTask {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => DatacenterTaskDevice, x => x.datacenterTask)
  datacenterTaskDevices = new Collection<DatacenterTaskDevice>(this);

}

@Entity()
class DatacenterTaskDevice {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => DatacenterTask)
  datacenterTask!: DatacenterTask;

  @ManyToOne(() => MicroCloud, { nullable: true })
  microCloud?: MicroCloud;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [DatacenterTaskDevice],
    dbName: ':memory:',
    populateWhere: 'infer',
    forceUndefined: true,
  });
  await orm.schema.createSchema();
});

afterAll(() => orm.close(true));

test('filters and nested populate of to-many relations', async () => {
  orm.em.create(DatacenterTask, {
    datacenterTaskDevices: [
      {
        microCloud: undefined,
      },
      {
        microCloud: {},
      },
    ],
  });

  await orm.em.flush();
  orm.em.clear();

  const datacenterTask1 = await orm.em.findOneOrFail(DatacenterTask, 1, {
    populate: ['datacenterTaskDevices'],
  });

  // Should be 2 devices
  expect(datacenterTask1.datacenterTaskDevices).toHaveLength(2);
  orm.em.clear();

  const datacenterTask2 = await orm.em.findOneOrFail(DatacenterTask, 1, {
    populate: ['datacenterTaskDevices.microCloud'],
    // populateWhere: { datacenterTaskDevices: { microCloud: { removedAt: null } } },
    // populateFilter: { datacenterTaskDevices: { microCloud: { removedAt: null } } },
  });

  // Should be 2 devices, even if some does not have (nullable field) microCloud
  expect(datacenterTask2.datacenterTaskDevices).toHaveLength(2);
});
