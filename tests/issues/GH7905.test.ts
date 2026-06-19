import { MikroORM } from '@mikro-orm/postgresql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

describe('GH issue 7905', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: `mikro_orm_test_gh_7905`,
      schemaGenerator: { ignoreRoutines: true },
    });

    await orm.schema.ensureDatabase();
    await orm.schema.refresh();

    // a function with an unnamed parameter, created outside of MikroORM
    await orm.schema.execute(`
      create or replace function echo_message(text)
      returns text as $$
      begin
        return $1;
      end;
      $$ language plpgsql;
    `);
  });

  afterAll(async () => {
    await orm.schema.execute(`drop function if exists echo_message(text)`);
    await orm.close(true);
  });

  it('introspects routines with unnamed parameters without throwing', async () => {
    const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(sql).toBe('');
  });
});
