import { Entity, Enum, PrimaryKey } from '@mikro-orm/core';
import { MikroORM as PostgresMikroORM } from '@mikro-orm/postgresql';
import { MikroORM as SqliteMikroORM } from '@mikro-orm/libsql';
import { MikroORM as MsSqlMikroORM } from '@mikro-orm/mssql';

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

describe('GH #7395 - enum CHECK constraint with single quotes', () => {

  test('postgres', async () => {
    const orm = await PostgresMikroORM.init({
      entities: [GH7395],
      dbName: 'mikro_orm_test_gh_7395',
    });
    await orm.schema.refreshDatabase();

    const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSQL).toContain(`check ("status" in ('it''s complicated', 'active'))`);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test('sqlite', async () => {
    const orm = await SqliteMikroORM.init({
      entities: [GH7395],
      dbName: ':memory:',
    });
    await orm.schema.refreshDatabase();

    const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSQL).toContain(`check (\`status\` in ('it''s complicated', 'active'))`);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.close(true);
  });

  test('mssql', async () => {
    const orm = await MsSqlMikroORM.init({
      entities: [GH7395],
      dbName: 'mikro_orm_test_gh_7395',
      password: 'Root.Root',
    });
    await orm.schema.refreshDatabase();

    const createSQL = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(createSQL).toContain(`check ([status] in ('it''s complicated', 'active'))`);

    const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff).toBe('');

    await orm.schema.dropSchema();
    await orm.close(true);
  });

});
