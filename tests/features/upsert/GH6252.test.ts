import {
  Entity,
  ManyToOne,
  MikroORM,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  ref,
  Ref,
} from '@mikro-orm/postgresql';

@Entity()
class Organization {

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property()
  name!: string;

}

@Entity()
class Sample {

  @ManyToOne(() => Organization, { primary: true })
  organization!: Ref<Organization>;

  @PrimaryKey({ type: 'uuid' })
  id!: string;

  [PrimaryKeyProp]?: ['organization', 'id'];

}

@Entity({ tableName: 'sample-stick-well' })
class SampleStickWell {

  @ManyToOne(() => Sample, { primary: true })
  sample!: Ref<Sample>;

  [PrimaryKeyProp]?: 'sample';

  @Property()
  createdAt = new Date();

  @Property()
  updatedAt = new Date();

  @Property()
  stickWellId!: string;

}

let orm: MikroORM;

const oid = 'ac21172f-98b0-436f-aeda-923d5e61748f';
const sid = '4953caed-cb20-4cb4-939e-958b1874a090';

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6252',
    entities: [SampleStickWell],
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
  await orm.em.insert(Organization, { id: oid, name: 'org' });
  await orm.em.insert(Sample, { id: sid, organization: oid });
});

afterAll(async () => {
  await orm.close(true);
});

test('upsert with DTO with FK as composite PK', async () => {
  const e = await orm.em.upsert(SampleStickWell, {
    sample: ref(Sample, [oid, sid]),
    stickWellId: 'value',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  orm.em.remove(e);
  await orm.em.flush();
});

test('upsertMany with DTO with FK as composite PK', async () => {
  const [e] = await orm.em.upsertMany(SampleStickWell, [{
    sample: ref(Sample, [oid, sid]),
    stickWellId: 'value',
    createdAt: new Date(),
    updatedAt: new Date(),
  }]);
  orm.em.remove(e);
  await orm.em.flush();
});

test('upsert with entity with FK as composite PK', async () => {
  const ssw = new SampleStickWell();
  ssw.sample = ref(Sample, [oid, sid]);
  ssw.stickWellId = 'value';
  ssw.createdAt = new Date();
  ssw.updatedAt = new Date();

  const e = await orm.em.upsert(SampleStickWell, ssw);
  orm.em.remove(e);
  await orm.em.flush();
});

test('upsertMany with entity with FK as composite PK', async () => {
  const ssw = new SampleStickWell();
  ssw.sample = ref(Sample, [oid, sid]);
  ssw.stickWellId = 'value';
  ssw.createdAt = new Date();
  ssw.updatedAt = new Date();

  const [e] = await orm.em.upsertMany(SampleStickWell, [ssw]);
  orm.em.remove(e);
  await orm.em.flush();
});
