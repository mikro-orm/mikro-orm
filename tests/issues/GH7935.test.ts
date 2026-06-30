import { Entity, Enum, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

// GH #7935 - An enum CHECK constraint defined on an abstract TPT parent must not
// be propagated to child TPT tables. In TPT the enum column lives only on the
// parent table, so a copy of the check on the child references a column that
// does not exist there and produces invalid DDL (e.g. sqlite `no such column`).

@Entity({ inheritance: 'tpt' })
abstract class Account7935 {

  @PrimaryKey()
  id!: number;

  @Enum({ items: ['active', 'suspended', 'closed'] })
  status!: string;

}

@Entity()
class SavingsAccount7935 extends Account7935 {

  @Property()
  interestRate!: number;

}

test('GH #7935 - parent TPT enum check is not propagated to child tables', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Account7935, SavingsAccount7935],
  });

  const sql = await orm.schema.getCreateSchemaSQL();

  // Parent table owns the enum column and its check constraint.
  expect(sql).toContain("`status` text check (`status` in ('active', 'suspended', 'closed'))");

  // Child table has no `status` column, so it must not get a copy of the check.
  expect(sql).not.toContain('savings_account7935_status_check');
  expect(sql).not.toMatch(/create table `savings_account7935`[^;]*`status`/);

  // The generated schema must be valid (this throws before the fix).
  await orm.schema.create();

  await orm.close();
});
