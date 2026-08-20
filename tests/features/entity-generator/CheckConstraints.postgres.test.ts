import { MikroORM } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
  create table "probe" (
    "id" uuid primary key default gen_random_uuid(),
    "code" varchar(63) not null,
    "mode" varchar(16) not null,
    "system_key" varchar(63),
    constraint "chk_probe_code_format" check ("code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    constraint "chk_probe_mode" check ("mode" in ('explicit', 'all-active')),
    constraint "chk_probe_shape" check ("mode" <> 'all-active' or "system_key" is not null)
  );
`;

test('check constraints are emitted in generated entities', async () => {
  const orm = await MikroORM.init({
    dbName: 'mikro_orm_test_entity_gen_checks',
    discovery: { warnWhenNoEntities: false },
    ensureDatabase: false,
    extensions: [EntityGenerator],
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(schema);
  }

  const dump = (await orm.entityGenerator.generate()).join('\n');
  expect(dump).toContain('chk_probe_code_format');
  expect(dump).toContain('chk_probe_shape');
  // the `mode in (...)` check is represented by the enum property instead
  expect(dump).not.toContain('chk_probe_mode');
  expect(dump).toMatchSnapshot();

  await orm.close(true);
});
