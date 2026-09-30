import { MikroORM } from '@mikro-orm/postgresql';
import { Check, Entity, Enum, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

enum Kind {
  A = 'A',
  B = 'B',
}

@Entity({ tableName: 'thing' })
@Check({ name: 'thing_rule', expression: `kind <> 'A' or qty > 0` })
class Thing {
  @PrimaryKey()
  id!: number;

  // `kind` sorts before `qty`, so introspection tags the multi-column check with the enum column
  @Enum({ items: () => Kind })
  kind!: Kind;

  @Property({ type: 'int' })
  qty!: number;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Thing],
    dbName: 'mikro_orm_test_gh8374',
  });
});

afterAll(() => orm.close(true));

test('edited class-level check referencing an enum column is detected', async () => {
  const check = orm.getMetadata(Thing).checks.find(c => c.name === 'thing_rule')!;
  check.expression = `kind <> 'A' or qty > 0`;
  await orm.schema.refresh();
  check.expression = `kind <> 'A' or qty > 5`;

  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff.up.trim()).toBe(
    `alter table "thing" drop constraint "thing_rule";\nalter table "thing" add constraint "thing_rule" check (kind <> 'A' or qty > 5);`,
  );
  expect(diff.down).toContain('drop constraint "thing_rule"');
  await orm.schema.execute(diff.up);
  expect(await orm.schema.getUpdateSchemaSQL({ wrap: false })).toBe('');
});

test('class-level check with `not in` referencing an enum column does not drift in either direction', async () => {
  const check = orm.getMetadata(Thing).checks.find(c => c.name === 'thing_rule')!;
  check.expression = `kind not in ('A', 'B') or qty > 0`;
  await orm.schema.refresh();

  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff).toEqual({ up: '', down: '' });
});
