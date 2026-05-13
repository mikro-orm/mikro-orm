import { Entity, Index, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

// GH #7714 - Expression indexes defined on an abstract TPT parent must not be
// propagated to child TPT tables. The child table does not have the parent's
// columns, so the expression resolves an empty column list and produces
// invalid SQL like `create ... index "dog__name_unique" on "dog" ()`.

@Entity({ inheritance: 'tpt' })
@Index({
  name: 'animal_name_unique',
  expression: (columns, table) =>
    `create unique index \`animal_name_unique\` on \`${table.name}\` (\`${columns.name}\`)`,
})
abstract class Animal7714 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Dog7714 extends Animal7714 {
  @Property()
  breed!: string;
}

test('GH #7714 - parent TPT expression indexes do not propagate to child tables', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Animal7714, Dog7714],
  });

  const sql = await orm.schema.getCreateSchemaSQL();

  // Parent table should have the expression index.
  expect(sql).toContain('create unique index `animal_name_unique` on `animal7714` (`name`)');

  // Child table must not get a copy of the parent index (it would reference
  // a column that doesn't exist in the child table).
  expect(sql).not.toContain('on `dog7714`');

  await orm.close();
});

@Entity({ inheritance: 'tpt' })
abstract class Animal7714b {
  @PrimaryKey()
  id!: number;

  @Index({ name: 'animal7714b_name_index' })
  @Unique({ name: 'animal7714b_name_unique' })
  @Property()
  name!: string;
}

@Entity()
class Dog7714b extends Animal7714b {
  @Property()
  breed!: string;
}

test('GH #7714 - parent TPT property indexes/uniques are not propagated to child tables', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Animal7714b, Dog7714b],
  });

  const sql = await orm.schema.getCreateSchemaSQL();

  // The named index/unique exist on the parent table only.
  expect(sql).toContain('`animal7714b_name_index`');
  expect(sql).toContain('`animal7714b_name_unique`');
  expect(sql).not.toMatch(/`animal7714b_name_index` on `dog7714b`/);
  expect(sql).not.toMatch(/`animal7714b_name_unique` on `dog7714b`/);

  await orm.close();
});
