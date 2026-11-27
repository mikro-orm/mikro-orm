import { Entity, MikroORM, ObjectId, Opt, PrimaryKey, Property, Unique } from '@mikro-orm/mongodb';

@Entity()
class VersionIncKeyDoc {

  @PrimaryKey()
  _id!: ObjectId;

  @Unique()
  @Property()
  key!: string;

  @Property({ type: 'json', nullable: true })
  data?: Record<string, unknown>;

  @Property({ version: true })
  version!: number & Opt;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [VersionIncKeyDoc],
    dbName: 'mikro_orm_version_inc_key_values_6x',
    clientUrl: 'mongodb://localhost:27017',
  });
  await orm.schema.refreshDatabase();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
  await orm.em.fork().insert(VersionIncKeyDoc, { key: 'd1', data: { x: 1 } });
});

afterAll(async () => {
  await orm.schema.dropSchema();
  await orm.close(true);
});

const stored = () => orm.em.fork().findOneOrFail(VersionIncKeyDoc, { key: 'd1' });

test('JSON value with an `$inc` key is stored as it is on flush', async () => {
  const em = orm.em.fork();
  const doc = await em.findOneOrFail(VersionIncKeyDoc, { key: 'd1' });
  em.assign(doc, { data: { $inc: 5, x: 1 } });
  await em.flush();

  expect(doc.version).toBe(2);
  expect(await stored()).toMatchObject({ data: { $inc: 5, x: 1 }, version: 2 });
});

test('JSON value with an `$inc` key is stored as it is via `em.nativeUpdate()`', async () => {
  await orm.em.fork().nativeUpdate(VersionIncKeyDoc, { key: 'd1' }, { data: { $inc: 5 } });
  expect(await stored()).toMatchObject({ data: { $inc: 5 }, version: 2 });
});

test('JSON value with an `$inc` key is stored as it is via `em.upsert()` and `em.upsertMany()`', async () => {
  await orm.em.fork().upsert(VersionIncKeyDoc, { key: 'd1', data: { $inc: 5 } });
  expect(await stored()).toMatchObject({ data: { $inc: 5 }, version: 2 });

  await orm.em.fork().upsertMany(VersionIncKeyDoc, [{ key: 'd1', data: { $inc: 6 } }]);
  expect(await stored()).toMatchObject({ data: { $inc: 6 }, version: 3 });
});
