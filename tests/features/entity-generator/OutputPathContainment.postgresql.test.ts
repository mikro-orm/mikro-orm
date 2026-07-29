import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { TEMP_DIR } from '../../helpers.js';

// native enum and routine names come from the database and end up in the output file name,
// so they must not be able to point the generator outside of the configured path
const schema = `
  create type "public"."../escaped_enum" as enum ('a', 'b');
  create table "public"."t1" (
    "id" int8 not null,
    primary key ("id")
  );
`;

const outDir = `${TEMP_DIR}/containment/nested`;

describe('generated files stay inside the configured path', () => {
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

  test('a traversing name is rejected instead of written outside the path', async () => {
    await expect(orm.entityGenerator.generate({ save: true, path: outDir })).rejects.toThrow(
      /outside of the configured path/,
    );

    expect(existsSync(`${TEMP_DIR}/containment/escaped_enum.ts`)).toBe(false);
  });

  test('a nested file name is still allowed', async () => {
    await orm.entityGenerator.generate({
      save: true,
      path: outDir,
      fileName: className => `sub/dir/${className}`,
    });

    expect(existsSync(`${outDir}/sub/dir/T1.ts`)).toBe(true);
  });
});
