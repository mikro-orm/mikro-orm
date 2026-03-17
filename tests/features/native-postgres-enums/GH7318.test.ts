import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, Enum, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

enum CompanyTag {
  foo = 'foo',
  bar = 'bar',
}

@Entity({ tableName: 'company', schema: 'company' })
class Company {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'text' })
  name!: string;

  @Enum({
    items: () => CompanyTag,
    nativeEnumName: 'company_tag',
    default: [],
    array: true,
  })
  tags: CompanyTag[] = [];
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Company],
    dbName: '7318',
  });

  await orm.schema.ensureDatabase();
  await orm.schema.execute('drop schema if exists company cascade');
});

afterAll(() => orm.close());

test('GH #7318 - enum arrays with non-default schema', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toContain(`create schema if not exists "company";`);
  expect(sql).toContain(`create type "company"."company_tag" as enum ('foo', 'bar');`);
  expect(sql).toContain(`"tags" "company"."company_tag"[] not null`);

  // this used to fail with: type "company_tag[]" does not exist
  await orm.schema.execute(sql);

  // update should produce no diff
  const diff = await orm.schema.getUpdateSchemaSQL();
  expect(diff).toBe('');
});

test('GH #7318 - refresh with enum arrays in non-default schema', async () => {
  // this used to fail with: type "company_tag[]" does not exist
  await orm.schema.refresh();
});
