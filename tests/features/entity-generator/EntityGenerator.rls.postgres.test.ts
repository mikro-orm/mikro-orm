import { defineEntity, MikroORM, p, type EntityMetadata } from '@mikro-orm/postgresql';
import { DatabaseSchema, SchemaComparator } from '@mikro-orm/sql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

// fixed role name (not random) so the emitted `roles` array stays snapshot-stable
const APP_ROLE = 'rls_generator_role';

const RlsDocumentSchema = defineEntity({
  name: 'RlsDocument',
  rowLevelSecurity: 'force',
  policies: [
    // using-only, per-command, default (public) roles
    { name: 'doc_select_own', command: 'select', using: `owner_id = current_setting('app.user_id')::int` },
    // check-only, per-command
    { name: 'doc_insert_own', command: 'insert', check: `owner_id = current_setting('app.user_id')::int` },
    // restrictive, applies to all commands
    { name: 'doc_hide_deleted', type: 'restrictive', using: `deleted = false` },
    // explicit non-default role, both using and check
    { name: 'doc_admin_all', command: 'update', roles: [APP_ROLE], using: `true`, check: `true` },
  ],
  properties: {
    id: p.integer().primary().autoincrement(),
    ownerId: p.integer(),
    deleted: p.boolean().default(false),
  },
});

// RLS enabled without any policies -> deny-all
const RlsSecretSchema = defineEntity({
  name: 'RlsSecret',
  rowLevelSecurity: true,
  properties: {
    id: p.integer().primary().autoincrement(),
    value: p.string(),
  },
});

describe('EntityGenerator — row level security (PostgreSQL)', () => {
  let orm: MikroORM;
  const dbName = `mikro_orm_test_rls_gen_${Math.random().toString(36).slice(2, 8)}`;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName,
      entities: [RlsDocumentSchema, RlsSecretSchema],
      extensions: [EntityGenerator],
      ensureDatabase: false,
    });
    await orm.schema.ensureDatabase();
    // policies referencing a role require the role to exist before the schema is built; roles are cluster-global
    await orm.em.getConnection().execute(`drop role if exists ${APP_ROLE}`);
    await orm.em.getConnection().execute(`create role ${APP_ROLE}`);
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.em.getConnection().execute(`drop role if exists ${APP_ROLE}`);
    await orm.close(true);
  });

  test('decorators mode re-declares policies and forced RLS', async () => {
    const dump = await orm.entityGenerator.generate({ entityDefinition: 'decorators' });
    expect(dump.find(f => f.includes('class RlsDocument'))).toMatchSnapshot('document-decorators');
    expect(dump.find(f => f.includes('class RlsSecret'))).toMatchSnapshot('secret-decorators');
  });

  test('entitySchema mode re-declares policies and forced RLS', async () => {
    const dump = await orm.entityGenerator.generate({ entityDefinition: 'entitySchema' });
    expect(dump.find(f => f.includes('RlsDocumentSchema'))).toMatchSnapshot('document-entitySchema');
    expect(dump.find(f => f.includes('RlsSecretSchema'))).toMatchSnapshot('secret-entitySchema');
  });

  test('defineEntity mode re-declares policies and forced RLS', async () => {
    const dump = await orm.entityGenerator.generate({ entityDefinition: 'defineEntity' });
    expect(dump.find(f => f.includes('RlsDocumentSchema'))).toMatchSnapshot('document-defineEntity');
    expect(dump.find(f => f.includes('RlsSecretSchema'))).toMatchSnapshot('secret-defineEntity');
  });

  test('generated metadata round-trips to an empty RLS schema diff', async () => {
    let generated: EntityMetadata[] = [];
    await orm.entityGenerator.generate({
      entityDefinition: 'decorators',
      onProcessedMetadata: metadata => {
        generated = metadata;
      },
    });

    const platform = orm.em.getPlatform();
    const target = DatabaseSchema.fromMetadata(generated, platform, orm.config);
    const actual = await DatabaseSchema.create(orm.em.getConnection(), platform, orm.config);
    const diff = new SchemaComparator(platform).compare(actual, target);

    for (const table of ['rls_document', 'rls_secret']) {
      // table exists on both sides (not created/dropped), and no RLS delta remains
      expect(diff.newTables[table]).toBeUndefined();
      expect(diff.removedTables[table]).toBeUndefined();

      const tableDiff = diff.changedTables[table];

      if (tableDiff) {
        expect(tableDiff.changedRlsEnabled).toBeUndefined();
        expect(tableDiff.changedRlsForced).toBeUndefined();
        expect(tableDiff.addedPolicies).toEqual({});
        expect(tableDiff.removedPolicies).toEqual({});
      }
    }
  });
});

describe('EntityGenerator — RLS disabled with staged policies (PostgreSQL)', () => {
  const dbName = `mikro_orm_test_rls_gen_disabled_${Math.random().toString(36).slice(2, 8)}`;

  // policies present but RLS disabled — a legal pg state the generator must reproduce faithfully
  const RlsStagedSchema = defineEntity({
    name: 'RlsStaged',
    rowLevelSecurity: false,
    policies: [{ name: 'staged_sel', using: `id > 0` }],
    properties: {
      id: p.integer().primary().autoincrement(),
      tenantId: p.integer(),
    },
  });

  test('emits rowLevelSecurity: false and round-trips to an empty diff', async () => {
    const orm = await MikroORM.init({
      dbName,
      entities: [RlsStagedSchema],
      extensions: [EntityGenerator],
      ensureDatabase: false,
    });

    try {
      await orm.schema.ensureDatabase();
      await orm.schema.refresh();

      let generated: EntityMetadata[] = [];
      const dump = await orm.entityGenerator.generate({
        entityDefinition: 'decorators',
        onProcessedMetadata: metadata => {
          generated = metadata;
        },
      });

      // the policies-imply-RLS default would re-enable RLS on reload, so `false` must be emitted explicitly
      const src = dump.find(f => f.includes('class RlsStaged'))!;
      expect(src).toContain('rowLevelSecurity: false');
      expect(src).toContain('staged_sel');

      const platform = orm.em.getPlatform();
      const target = DatabaseSchema.fromMetadata(generated, platform, orm.config);
      const actual = await DatabaseSchema.create(orm.em.getConnection(), platform, orm.config);
      const diff = new SchemaComparator(platform).compare(actual, target);

      expect(diff.newTables['rls_staged']).toBeUndefined();
      expect(diff.removedTables['rls_staged']).toBeUndefined();
      const tableDiff = diff.changedTables['rls_staged'];

      if (tableDiff) {
        expect(tableDiff.changedRlsEnabled).toBeUndefined();
        expect(tableDiff.addedPolicies).toEqual({});
        expect(tableDiff.removedPolicies).toEqual({});
      }

      await orm.schema.dropDatabase();
    } finally {
      await orm.close(true);
    }
  });

  test('policy expressions containing backslashes survive the emitted source', async () => {
    const RlsRegexSchema = defineEntity({
      name: 'RlsRegex',
      tableName: 'rls_regex',
      rowLevelSecurity: true,
      policies: [{ name: 'regex_sel', command: 'select', using: String.raw`name ~ '^\d+'` }],
      properties: {
        id: p.integer().primary().autoincrement(),
        name: p.string(),
      },
    });

    const orm = await MikroORM.init({
      dbName: `${dbName}_regex`,
      entities: [RlsRegexSchema],
      extensions: [EntityGenerator],
      ensureDatabase: false,
    });

    try {
      await orm.schema.ensureDatabase();
      await orm.schema.refresh();

      const dump = await orm.entityGenerator.generate({ entityDefinition: 'decorators' });
      const src = dump.find(f => f.includes('class RlsRegex'))!;
      // `\d` must arrive as an escaped backslash, or the generated file silently degrades the predicate to `d`
      expect(src).toContain(String.raw`~ ''^\\d+''`.replaceAll(`''`, `\\'`));

      await orm.schema.dropDatabase();
    } finally {
      await orm.close(true);
    }
  });
});
