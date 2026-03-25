import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, Enum, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

enum Status {
  ItsComplicated = "it's complicated",
  Active = 'active',
}

@Entity()
class GH7395 {
  @PrimaryKey()
  id!: number;

  @Enum({ items: () => Status })
  status!: Status;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [GH7395],
    dbName: 'mikro_orm_test_gh_7395',
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.schema.drop();
  await orm.close(true);
});

test('GH #7395 - enum CHECK constraint with single quotes in values', async () => {
  const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
  // Single quotes must be escaped as '' in SQL
  expect(createSQL).toContain(`check ("status" in ('it''s complicated', 'active'))`);
  expect(createSQL).not.toContain(`check ("status" in ('it's complicated', 'active'))`);

  // Ensure no diff is generated (schema is in sync)
  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toBe('');
});
