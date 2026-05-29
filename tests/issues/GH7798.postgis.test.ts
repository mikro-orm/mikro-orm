import { MikroORM } from '@mikro-orm/postgresql';
import { Check, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'account7798pg' })
@Check({
  name: 'this_is_an_absurdly_long_check_constraint_name_to_trigger_postgres_truncation_7798',
  expression: 'balance >= 0',
})
class Account7798pg {
  @PrimaryKey({ type: 'number' })
  id!: number;

  @Property({ type: 'number' })
  balance!: number;

  @Property({ columnType: 'geometry(point, 4326)', type: 'string' })
  location!: string;
}

const DB = 'mikro_orm_test_gh7798_postgis';

describe('GH #7798 — spurious schema diff on Postgres geometry typmod and truncated identifiers', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Account7798pg],
      dbName: DB,
      port: 5433,
    });
    await orm.schema.dropDatabase();
    await orm.schema.createDatabase(DB);
    await orm.schema.execute('create extension if not exists postgis');
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('no schema drift is detected right after creating the schema', async () => {
    const diff = await orm.schema.getUpdateSchemaSQL();
    expect(diff).toBe('');
  });
});
