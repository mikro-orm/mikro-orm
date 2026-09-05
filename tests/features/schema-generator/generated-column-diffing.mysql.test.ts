import { MikroORM } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // entity-side 'a_b' has no _utf8mb4 introducer, so the introducer-stripping regex must not corrupt it
  @Property({
    type: 'string',
    nullable: true,
    generated: `(case when \`name\` = 'a_b' then 'x' else null end) virtual`,
  })
  label?: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: `generated-column-diffing`,
    port: 3308,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('generated column with an underscore string literal is not churned', async () => {
  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff).toEqual({ up: '', down: '' });
});
