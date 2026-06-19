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
  async function createOrm(ignoreRoutines: boolean) {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [User],
      dbName: `mikro_orm_test_gh_7905`,
      schemaGenerator: { ignoreRoutines },
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

    return orm;
  }

  it('introspects routines with unnamed parameters without throwing (ignoreRoutines enabled)', async () => {
    const orm = await createOrm(true);
    const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    // routines are left unmanaged — no churn for the externally created function
    expect(sql).toBe('');
    await orm.schema.execute(`drop function if exists echo_message(text)`);
    await orm.close(true);
  });

  it('diffs the unmanaged routine for removal without throwing (ignoreRoutines disabled)', async () => {
    const orm = await createOrm(false);
    const sql = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    // unmanaged routine gets dropped, with the unnamed parameter rendered as a bare type
    expect(sql).toMatch(/drop function if exists "echo_message"\(text\)/i);
    await orm.schema.execute(`drop function if exists echo_message(text)`);
    await orm.close(true);
  });
});
