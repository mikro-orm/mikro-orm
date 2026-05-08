import { defineEntity, p, Type } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

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

test('getKysely({ convertValues: true }) wraps SELECT columns with convertToJSValueSQL', async () => {
  const kysely = orm.em.getKysely<{
    Doc: { id: number; title: string; content: string };
  }>({
    tableNamingStrategy: 'entity',
    convertValues: true,
  });

  await kysely.insertInto('Doc').values({ id: 2, title: 't', content: 'hello' }).execute();

  expect(kysely.selectFrom('Doc').selectAll().compile().sql).toContain('hex(');
  expect(kysely.selectFrom('Doc as d').select('d.content').compile().sql).toContain('hex(');
  expect(kysely.selectFrom('Doc').select('content').compile().sql).toContain('hex(');

  const row = await kysely.selectFrom('Doc').selectAll().where('id', '=', 2).executeTakeFirstOrThrow();
  expect(row.content).toBe('hello');

  const aliased = await kysely
    .selectFrom('Doc as d')
    .select(['d.content'])
    .where('d.id', '=', 2)
    .executeTakeFirstOrThrow();
  expect(aliased.content).toBe('hello');
});
