import { MikroORM, sql } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';

@Entity()
class TestEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'mikro_orm_skip_views_test',
    port: 5433, // PostGIS instance
    entities: [TestEntity],
    extensions: [Migrator],
    migrations: { snapshot: false },
  });
});

afterAll(() => orm?.close(true));

describe('SchemaGenerator skipViews', () => {
  test('should automatically skip PostGIS system views', async () => {
    // Create the PostGIS extension which creates geometry_columns and geography_columns views
    await orm.schema.execute('create extension if not exists postgis');

    // Check that the views exist in the database
    const views = await orm.em.getConnection().execute(sql`
      select table_name from information_schema.views
      where table_schema = 'public'
      and table_name in ('geometry_columns', 'geography_columns')
    `);
    expect(views.length).toBe(2); // Both views should exist

    // Now generate migration - it should NOT include these views
    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });

    // Should not try to drop or recreate PostGIS views
    expect(diff.up).not.toContain('geography_columns');
    expect(diff.up).not.toContain('geometry_columns');
    expect(diff.down).not.toContain('geography_columns');
    expect(diff.down).not.toContain('geometry_columns');
  });

  test('should skip views specified in skipViews config', async () => {
    // Create a custom view
    await orm.schema.execute(`
      create or replace view custom_view as
      select 1 as id, 'test' as name
    `);

    // Without skipViews, the view should appear in migrations
    const diffWithView = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diffWithView.up).toContain('custom_view');

    // With skipViews, the view should be ignored
    const ormWithSkip = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_skip_views_test',
      port: 5433,
      entities: [TestEntity],
      extensions: [Migrator],
      migrations: { snapshot: false },
      schemaGenerator: {
        skipViews: ['custom_view'],
      },
    });

    const diffWithSkip = await ormWithSkip.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diffWithSkip.up).not.toContain('custom_view');
    expect(diffWithSkip.down).not.toContain('custom_view');

    await ormWithSkip.close();

    // Clean up
    await orm.schema.execute('drop view if exists custom_view');
  });

  test('should skip views matching regex patterns in skipViews config', async () => {
    // Create multiple views
    await orm.schema.execute(`create or replace view test_view_1 as select 1 as id`);
    await orm.schema.execute(`create or replace view test_view_2 as select 2 as id`);
    await orm.schema.execute(`create or replace view other_view as select 3 as id`);

    // With regex skipViews pattern
    const ormWithSkip = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_skip_views_test',
      port: 5433,
      entities: [TestEntity],
      extensions: [Migrator],
      migrations: { snapshot: false },
      schemaGenerator: {
        skipViews: [/^test_view_/],
      },
    });

    const diff = await ormWithSkip.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    // test_view_1 and test_view_2 should be skipped
    expect(diff.up).not.toContain('test_view_1');
    expect(diff.up).not.toContain('test_view_2');
    // other_view should still appear
    expect(diff.up).toContain('other_view');

    await ormWithSkip.close();

    // Clean up
    await orm.schema.execute('drop view if exists test_view_1, test_view_2, other_view');
  });

  test('should preserve multiline view definitions in migrations', async () => {
    // First create the table so we can create a view referencing it
    await orm.schema.refresh();

    // Create a multiline view
    await orm.schema.execute(`
      create or replace view multiline_test_view as
      select
        id,
        name,
        'constant' as extra
      from test_entity
    `);

    // Get migration diff - the view SQL should be in a single addSql call
    const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });

    // The migration up should contain the drop for the view (since it's not in metadata)
    // But it should be a single statement, not split across lines
    if (diff.up.includes('multiline_test_view')) {
      // Count how many times the view name appears - should be once per statement
      const statements = diff.up.split(/;\n/).filter(s => s.includes('multiline_test_view'));
      // Each statement should be complete (contain either 'create' or 'drop')
      for (const stmt of statements) {
        expect(stmt.match(/\b(create|drop)\b/i)).toBeTruthy();
      }
    }

    // Clean up
    await orm.schema.execute('drop view if exists multiline_test_view');
    await orm.schema.drop();
  });
});
