import { MikroORM } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  // MySQL reports a `(current_date)` expression default back as `curdate()`; the comparator must treat
  // the two as equal (like it already does for `current_timestamp` on datetime columns), otherwise the
  // column churns a no-op migration on every diff.
  @Property({ type: 'date', defaultRaw: `(current_date)` })
  day!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: `date-default-diffing`,
    port: 3308,
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('date column with a (current_date) default is not churned', async () => {
  const diff = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
  expect(diff).toEqual({
    up: '',
    down: '',
  });
});
