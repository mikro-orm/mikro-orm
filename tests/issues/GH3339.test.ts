import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';


@Entity({
  tableName: 'gh3339.Customer',
})
export class Customer {

  @PrimaryKey({ fieldName: 'ID', type: 'number' })
  id!: number;

  @Property()
  customerName?: string;

}

describe('GH issue 3339', () => {
  it('should reinit the schema', async () => {
    const orm: MikroORM<SqliteDriver> = await MikroORM.init({
        entities: [Customer], // make sure name Field of Customer is 'customerName'
        dbName: `mikro_orm_test_gh_3339`,
        type: 'postgresql',
        schema: 'gh3339',
    });

    const generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.execute(`drop schema if exists "gh3339" cascade`);
    await generator.createSchema();
    await generator.refreshDatabase();
    await orm.close(true);
  });

  it('should reference the schema name inside the sql update query', async () => {

    // make sure name Field of Customer is 'name'

    const orm = await MikroORM.init({
        entities: [Customer],
        dbName: `mikro_orm_test_gh_3339`,
        type: 'postgresql',
        schema: 'gh3339',
      });

    const generator = orm.getSchemaGenerator();

    const sql = await generator.getUpdateSchemaSQL({ schema: 'gh3339' });
    await generator.dropSchema();
    await generator.refreshDatabase();
    await orm.close(true);

    try {
        expect(sql).toContain('gh3339');
    } catch {
        expect(sql).toBe('');
    }

  });
});
