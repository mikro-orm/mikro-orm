import { MikroORM } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  // The generation expression contains a string literal with an underscore (`'a_b'`). MySQL reports
  // it back with a charset introducer (`_utf8mb4'a_b'`); when the comparator strips introducers it
  // must not corrupt the un-introduced entity-side literal, otherwise this column churns on every diff.
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
  expect(diff).toEqual({
    up: '',
    down: '',
  });
});
