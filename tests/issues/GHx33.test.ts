import { defineEntity, EventArgs, EventSubscriber, MikroORM, p, wrap } from '@mikro-orm/sqlite';

const Item = defineEntity({
  name: 'Item',
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.string(),
    url: p.string(),
    note: p.string().nullable(),
  },
});

class FindOneInHookSubscriber implements EventSubscriber {
  async beforeUpdate(args: EventArgs<any>): Promise<void> {
    // loading the same entity inside beforeUpdate should not overwrite pending changes
    await args.em.findOne(args.meta!.class, args.entity);
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Item],
    subscribers: [new FindOneInHookSubscriber()],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('findOne in beforeUpdate subscriber should not overwrite pending changes on loaded entity', async () => {
  const em = orm.em.fork();
  const item = em.create(Item, { name: 'Name', url: 'any' });
  await em.flush();

  wrap(item).assign({ name: 'New name' });
  await em.flush();

  // clear and reload from DB to verify the update was persisted
  em.clear();
  const reloaded = await em.findOneOrFail(Item, item.id);
  expect(reloaded.name).toBe('New name');
});

test('findOne in beforeUpdate subscriber should not overwrite pending changes on reference', async () => {
  const em = orm.em.fork();
  const item = em.create(Item, { name: 'Name', url: 'any' });
  await em.flush();

  em.clear();

  const reference = em.getReference(Item, item.id);
  wrap(reference).assign({ name: 'New name' });
  await em.flush();

  // clear and reload from DB to verify the update was persisted
  em.clear();
  const reloaded = await em.findOneOrFail(Item, item.id);
  expect(reloaded.name).toBe('New name');
});

test('user changes on reference are persisted after findOne re-initializes it', async () => {
  const em = orm.em.fork();
  const item = em.create(Item, { name: 'Name', url: 'any' });
  await em.flush();

  em.clear();

  // get a reference, modify it, then findOne before flushing
  const reference = em.getReference(Item, item.id);
  wrap(reference).assign({ name: 'New name' });

  // findOne loads full data — should not lose the pending change
  const loaded = await em.findOne(Item, item.id);
  expect(loaded).toBe(reference);
  expect(loaded!.name).toBe('New name');

  // the change should still be persisted on flush
  await em.flush();
  em.clear();
  const reloaded = await em.findOneOrFail(Item, item.id);
  expect(reloaded.name).toBe('New name');
});

test('mergeData preserves user setting a property to undefined (forceUndefined)', async () => {
  await orm.close();
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Item],
    forceUndefined: true,
  });
  await orm.schema.create();

  const em = orm.em.fork();
  const item = em.create(Item, { name: 'Name', url: 'any', note: 'some note' });
  await em.flush();

  // user explicitly unsets the note
  item.note = undefined;
  await em.flush();

  em.clear();
  const reloaded = await em.findOneOrFail(Item, item.id);
  expect(reloaded.note).toBeUndefined();
});
