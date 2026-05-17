import { defineEntity, MikroORM, ObjectId } from '@mikro-orm/mongodb';
import { Routine } from '@mikro-orm/core';

const TestSchema = defineEntity({
  name: 'Test',
  properties: p => ({
    _id: p.type(ObjectId).primary(),
    name: p.string(),
  }),
});

describe('stored routines — Mongo (not supported)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: 'mikro_orm_routines_mongo_test',
      clientUrl: 'mongodb://localhost:27017',
      entities: [TestSchema],
      discovery: { warnWhenNoEntities: false },
    });
  });

  afterAll(() => orm.close(true));

  it('em.callRoutine throws on Mongo with a clear message', async () => {
    const Whatever = new Routine({
      name: 'whatever',
      type: 'function',
      params: { x: { type: 'string' } },
      returns: { runtimeType: 'string', columnType: 'text' },
      body: 'noop',
    });

    // Mongo doesn't expose a routines config option; we exercise the base Connection.callRoutine
    // throw by routing through the connection layer directly.
    const conn = orm.em.getDriver().getConnection('write') as any;
    await expect(conn.callRoutine(Whatever, {})).rejects.toThrow(/not supported by the current driver/);
  });
});
