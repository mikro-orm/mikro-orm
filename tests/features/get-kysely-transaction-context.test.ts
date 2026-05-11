import { defineEntity, p } from '@mikro-orm/core';
import { MikroORM, Type } from '@mikro-orm/sqlite';

class HexEncodedType extends Type<string | null, string | null> {
  override convertToJSValueSQL(key: string): string {
    return `hex(${key})`;
  }

  override convertToJSValue(value: string | null): string | null {
    if (value == null) {
      return value;
    }
    return Buffer.from(value, 'hex').toString('utf8');
  }

  override convertToDatabaseValueSQL(key: string): string {
    return `unhex(${key})`;
  }

  override convertToDatabaseValue(value: string | null): string | null {
    if (value == null) {
      return value;
    }
    return Buffer.from(value, 'utf8').toString('hex');
  }
}

const Doc = defineEntity({
  name: 'Doc',
  properties: {
    id: p.integer().primary().autoincrement(),
    title: p.string(),
    content: p.type(HexEncodedType),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = new MikroORM({
    entities: [Doc],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

beforeEach(async () => {
  await orm.em.getKysely<{ Doc: object }>({ tableNamingStrategy: 'entity' }).deleteFrom('Doc').execute();
});

test('getKysely() inside transactional commits writes via Kysely .execute()', async () => {
  await orm.em.transactional(async em => {
    const kysely = em.getKysely<{ Doc: { id: number; title: string; content: string } }>({
      tableNamingStrategy: 'entity',
      convertValues: true,
    });

    await kysely.insertInto('Doc').values({ id: 1, title: 't', content: 'committed' }).execute();
  });

  const row = await orm.em
    .fork()
    .getKysely<{ Doc: { id: number; title: string; content: string } }>({
      tableNamingStrategy: 'entity',
      convertValues: true,
    })
    .selectFrom('Doc')
    .selectAll()
    .where('id', '=', 1)
    .executeTakeFirstOrThrow();

  expect(row.content).toBe('committed');
});

test('getKysely() inside transactional rolls back writes when the tx throws', async () => {
  await expect(
    orm.em.transactional(async em => {
      const kysely = em.getKysely<{ Doc: { id: number; title: string; content: string } }>({
        tableNamingStrategy: 'entity',
        convertValues: true,
      });

      await kysely.insertInto('Doc').values({ id: 2, title: 't', content: 'rolled-back' }).execute();

      // sanity check: visible inside the same tx
      const inside = await kysely.selectFrom('Doc').selectAll().where('id', '=', 2).executeTakeFirstOrThrow();
      expect(inside.content).toBe('rolled-back');

      throw new Error('boom');
    }),
  ).rejects.toThrow('boom');

  const after = await orm.em
    .fork()
    .getKysely<{ Doc: { id: number; title: string; content: string } }>({ tableNamingStrategy: 'entity' })
    .selectFrom('Doc')
    .selectAll()
    .where('id', '=', 2)
    .executeTakeFirst();

  expect(after).toBeUndefined();
});

test('em.fork().getKysely() inside transactional returns a non-tx-bound instance', async () => {
  await orm.em.transactional(async em => {
    const trxKysely = em.getKysely<{ Doc: object }>({ tableNamingStrategy: 'entity' });
    const forkKysely = em.fork().getKysely<{ Doc: object }>({ tableNamingStrategy: 'entity' });
    // the forked EM has no tx context, so its kysely is a fresh plugin-wrapped instance
    // over the pool client — not the same instance as the tx-bound kysely returned above.
    expect(trxKysely).not.toBe(forkKysely);
  });
});
