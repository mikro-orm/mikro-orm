import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'a' })
@Unique({ name: 'a_partial', expression: 'create unique index "a_partial" on "a" ("y") where "x" is null' })
class A {
  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  x?: string;

  @Property()
  y!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [A],
    dbName: 'mikro_orm_test_gh8363',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('GH #8363', async () => {
  await orm.schema.execute('drop index "a_partial"');

  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff.up.trim()).toBe('create unique index "a_partial" on "a" ("y") where "x" is null;');
  expect(diff.down.trim()).toBe('drop index "a_partial";');
  await orm.schema.execute(diff.up);
  await orm.schema.execute(diff.down);
});
