import { MikroORM, SimpleLogger } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

@Entity()
class ExampleEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ persist: false })
  virtualField?: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [ExampleEntity],
    loggerFactory: SimpleLogger.create,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7344 - upsert should ignore persist: false properties', async () => {
  const mock = mockLogger(orm);

  const e1 = await orm.em.upsert(ExampleEntity, {
    id: 1,
    name: 'test',
    virtualField: 'should not be persisted',
  });
  expect(e1.id).toBe(1);
  expect(e1.name).toBe('test');
  expect(mock.mock.calls[0][0]).not.toMatch(/virtualField/);
  expect(mock.mock.calls[0][0]).not.toMatch(/virtual_field/);

  mock.mockReset();

  // update via upsert
  const e2 = await orm.em.upsert(ExampleEntity, {
    id: 1,
    name: 'updated',
    virtualField: 'still should not be persisted',
  });
  expect(e2.id).toBe(1);
  expect(e2.name).toBe('updated');
  expect(mock.mock.calls[0][0]).not.toMatch(/virtualField/);
  expect(mock.mock.calls[0][0]).not.toMatch(/virtual_field/);
});

test('GH #7344 - upsertMany should ignore persist: false properties', async () => {
  orm.em.clear();
  const mock = mockLogger(orm);

  const entities = await orm.em.upsertMany(ExampleEntity, [
    { id: 10, name: 'first', virtualField: 'nope' },
    { id: 11, name: 'second', virtualField: 'nope' },
  ]);
  expect(entities).toHaveLength(2);
  expect(entities[0].name).toBe('first');
  expect(entities[1].name).toBe('second');

  for (const call of mock.mock.calls) {
    expect(call[0]).not.toMatch(/virtualField/);
    expect(call[0]).not.toMatch(/virtual_field/);
  }
});
