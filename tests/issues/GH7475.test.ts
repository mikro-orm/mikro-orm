import { MikroORM, PrimaryKeyProp, Ref } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';

@Entity()
class Organization {
  @PrimaryKey()
  id!: number;
}

@Entity()
class Measurement {
  [PrimaryKeyProp]?: ['organization', 'id'];

  @ManyToOne(() => Organization, { ref: true, primary: true })
  organization!: Ref<Organization>;

  @PrimaryKey()
  id!: string;
}

@Entity()
class Artifact {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToOne(() => Measurement, { ref: true, nullable: true })
  measurement?: Ref<Measurement> | null;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Organization, Measurement, Artifact],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('GH #7475 - nativeInsertMany with null composite FK', async () => {
  const mock = mockLogger(orm);

  // nativeInsertMany path (multiple entities)
  orm.em.create(Artifact, { id: 1, name: 'a1', measurement: null });
  orm.em.create(Artifact, { id: 2, name: 'a2', measurement: null });
  await orm.em.flush();

  const insertCall = mock.mock.calls.find(c => c[0].match(/insert into `artifact`/));
  expect(insertCall![0]).toMatch(/null, null\), \(2/);
  orm.em.clear();

  const artifacts = await orm.em.findAll(Artifact);
  expect(artifacts).toHaveLength(2);
  expect(artifacts[0].measurement).toBeNull();
  expect(artifacts[1].measurement).toBeNull();
});

test('GH #7475 - nativeInsert with null composite FK', async () => {
  orm.em.clear();
  const mock = mockLogger(orm);

  await orm.em.insert(Artifact, { id: 3, name: 'a3', measurement: null });

  expect(mock.mock.calls[0][0]).toMatch(/insert into `artifact`/);

  const artifact = await orm.em.findOne(Artifact, { id: 3 });
  expect(artifact).toBeDefined();
  expect(artifact!.measurement).toBeNull();
});
