import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { TEMP_DIR } from '../../helpers.js';

// native enum and routine names come from the database and end up in the output file name,
// so path separators in them must not point the generator outside of the configured path
const schema = `
  create type "public"."../escaped_enum" as enum ('a', 'b');
  create function "public"."../escaped_routine"() returns int as $$ select 1 $$ language sql;
  create table "public"."t1" (
    "id" int8 not null,
    primary key ("id")
  );
`;

const outDir = `${TEMP_DIR}/containment/nested`;

describe('names taken from the database cannot escape the configured path', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'entity_gen_containment',
      discovery: { warnWhenNoEntities: false },
      ensureDatabase: false,
      extensions: [EntityGenerator],
    });

    if (await orm.schema.ensureDatabase({ create: true })) {
      await orm.schema.execute(schema);
    }
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
    await rm(`${TEMP_DIR}/containment`, { recursive: true, force: true });
  });

  test('a traversing enum or routine name stays inside the configured path', async () => {
    await orm.entityGenerator.generate({ save: true, path: outDir });

    expect(existsSync(`${TEMP_DIR}/containment/escaped_enum.ts`)).toBe(false);
    expect(existsSync(`${TEMP_DIR}/containment/EscapedRoutine.ts`)).toBe(false);
    expect(existsSync(`${outDir}/_escaped_enum.ts`)).toBe(true);
    expect(existsSync(`${outDir}/EscapedRoutine.ts`)).toBe(true);
  });

  test('a custom fileName pointing elsewhere in the project still works', async () => {
    await orm.entityGenerator.generate({
      save: true,
      path: outDir,
      fileName: className => `../sibling/${className}`,
    });

    expect(existsSync(`${TEMP_DIR}/containment/sibling/T1.ts`)).toBe(true);
  });

  test('a file name leaving the project folder is rejected', async () => {
    await expect(
      orm.entityGenerator.generate({
        save: true,
        path: outDir,
        fileName: className => `${'../'.repeat(20)}tmp/${className}`,
      }),
    ).rejects.toThrow(/outside of the project folder/);
  });
});
