import { PGlite } from '@electric-sql/pglite';
import { MikroORM } from '@mikro-orm/pglite';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;
}

describe('GH #7862 — in-memory pglite is fully closed on orm.close()', () => {
  test('close tears the instance down; reconnect yields a fresh empty database', async () => {
    const init = () => MikroORM.init({ entities: [User], dbName: 'memory://' });

    const orm = await init();
    await orm.schema.create();
    orm.em.create(User, { id: 1, name: 'Foo' });
    await orm.em.flush();
    await expect(orm.em.fork().count(User)).resolves.toBe(1);

    // close really closes the underlying PGlite (no lingering async handles
    // for jest's open-handle detector); reconnecting therefore rebuilds a
    // fresh, empty in-memory instance instead of resurrecting the old data
    await orm.close();
    await orm.connect();
    await orm.schema.create();
    await expect(orm.em.fork().count(User)).resolves.toBe(0);

    await orm.close();
  });
});

describe('GH #7862 — externally managed pglite instance is used directly, not cloned', () => {
  test('the user-supplied instance receives the schema/data and is never deep-cloned', async () => {
    const pglite = await PGlite.create();
    const orm = await MikroORM.init({ entities: [User], driverOptions: { pglite } });

    // config normalization must keep the exact instance — deep-cloning would
    // invoke PGlite's async `clone()` and spin up a second, divergent database
    expect((orm.config.get('driverOptions') as { pglite: PGlite }).pglite).toBe(pglite);

    await orm.schema.create();
    orm.em.create(User, { id: 1, name: 'Foo' });
    await orm.em.flush();

    // the write must land in the user's own instance, queried directly
    const res = await pglite.query<{ count: number }>('select count(*)::int as count from "user"');
    expect(res.rows[0].count).toBe(1);

    await orm.close(true);
    await pglite.close();
  });
});
