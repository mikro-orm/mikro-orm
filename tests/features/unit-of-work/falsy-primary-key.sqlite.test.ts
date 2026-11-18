import { EntitySchema, MikroORM } from '@mikro-orm/sqlite';

for (const [type, id] of [
  ['integer', 0],
  ['bigint', 0n],
  ['string', ''],
] as const) {
  test(`reuses identity-map entries with a falsy ${type} primary key`, async () => {
    const Entity = new EntitySchema<{ id: typeof id; name: string }>({
      name: 'FalsyPrimaryKey',
      properties: {
        id: { type, primary: true, autoincrement: false },
        name: { type: 'string' },
      },
    });
    const logger = vi.fn();
    const orm = await MikroORM.init({
      entities: [Entity],
      dbName: ':memory:',
      debug: ['query'],
      logger,
    });

    try {
      await orm.schema.create();
      const em = orm.em.fork();
      const created = em.create(Entity, { id, name: 'original' });
      logger.mockClear();
      expect(await em.findOneOrFail(Entity, id)).toBe(created);
      expect(logger).not.toHaveBeenCalled();
      await em.flush();
      em.clear();
      const entity = await em.findOneOrFail(Entity, id);
      logger.mockClear();

      expect(await em.findOneOrFail(Entity, id)).toBe(entity);
      expect(await em.findOneOrFail(Entity, { id })).toBe(entity);
      expect(logger).not.toHaveBeenCalled();

      expect(await em.findOne(Entity, { id, name: 'different' })).toBeNull();
      expect(logger).toHaveBeenCalledOnce();
    } finally {
      await orm.close(true);
    }
  });
}
