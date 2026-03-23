import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity()
class JsonEntity {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'jsonb', nullable: true })
  data?: Record<string, unknown>[];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'gh7383',
    entities: [JsonEntity],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.schema.dropSchema();
  await orm.close(true);
});

test('em.refresh() on detached entity returns jsonb as parsed object', async () => {
  const em = orm.em.fork();

  // 1. Create and persist an entity with a jsonb column
  const entity = em.create(JsonEntity, {
    data: [{ key: 'value' }],
  });
  await em.flush();
  const id = entity.id;

  // 2. Clear the identity map (detaches all entities)
  em.clear();

  // 3. Load and modify the entity in a fresh context
  const loaded = await em.findOneOrFail(JsonEntity, id);
  loaded.data = [{ key: 'updated' }];
  await em.flush();

  // 4. Refresh the now-detached original entity
  await em.refresh(entity);

  // BUG: entity.data is the string '[{"key":"updated"}]' instead of the array [{ key: 'updated' }]
  expect(typeof entity.data).not.toBe('string');
  expect(entity.data).toEqual([{ key: 'updated' }]);
});
