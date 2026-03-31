import { Collection, defineEntity, MikroORM, p, PrimaryKeyProp, Ref } from '@mikro-orm/sqlite';

// GH #7445: defineEntity with composite primary keys and circular oneToMany/manyToOne
// relations triggers TypeScript circular reference errors

const OrganizationSchema = defineEntity({
  name: 'GH7445_Organization',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string(),
  },
});
class Organization extends OrganizationSchema.class {}
OrganizationSchema.setClass(Organization);

const MeasurementTaskSchema = defineEntity({
  name: 'GH7445_MeasurementTask',
  properties: {
    organization: () => p.manyToOne(Organization).ref().primary(),
    id: p.integer().primary(),
    name: p.string(),
    sample: () => p.manyToOne(SampleSchema).ref(),
  },
  primaryKeys: ['organization', 'id'],
});
class MeasurementTask extends MeasurementTaskSchema.class {}
MeasurementTaskSchema.setClass(MeasurementTask);

const SampleSchema = defineEntity({
  name: 'GH7445_Sample',
  properties: {
    organization: () => p.manyToOne(Organization).ref().primary(),
    id: p.integer().primary(),
    name: p.string(),
    tasks: () => p.oneToMany(MeasurementTask).mappedBy('sample'),
  },
  primaryKeys: ['organization', 'id'],
});
class Sample extends SampleSchema.class {}
SampleSchema.setClass(Sample);

type TaskEntity = InstanceType<typeof MeasurementTask>;
type SampleEntity = InstanceType<typeof Sample>;

const taskPKCheck: TaskEntity[typeof PrimaryKeyProp] = ['organization', 'id'];
const samplePKCheck: SampleEntity[typeof PrimaryKeyProp] = ['organization', 'id'];

const task = {} as TaskEntity;
const taskSample: Ref<SampleEntity> = task.sample;

const sample = {} as SampleEntity;
const sampleTasks: Collection<TaskEntity> = sample.tasks;

describe('GH #7445', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [OrganizationSchema, MeasurementTaskSchema, SampleSchema],
      dbName: ':memory:',
    });
    await orm.schema.create();
  });

  afterAll(() => orm.close(true));

  it('should support composite PKs with circular relations via defineEntity', async () => {
    const org = orm.em.create(Organization, { name: 'Org1' });
    const sample = orm.em.create(Sample, { id: 1, organization: org, name: 'Sample1' });
    const task = orm.em.create(MeasurementTask, { id: 1, organization: org, name: 'Task1', sample });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(
      MeasurementTask,
      { name: 'Task1' },
      {
        populate: ['sample'],
      },
    );
    expect(found.name).toBe('Task1');
    expect(found.sample.unwrap().name).toBe('Sample1');
  });
});
