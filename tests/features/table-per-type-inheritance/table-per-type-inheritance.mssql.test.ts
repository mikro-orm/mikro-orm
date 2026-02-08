import { MikroORM, MsSqlDriver, Opt } from '@mikro-orm/mssql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../bootstrap.js';

@Entity({ tableName: 'tpt_base', inheritance: 'tpt' })
abstract class TptBase {
  @PrimaryKey()
  id!: number;

  @Property()
  baseName!: string;

  @Property({ defaultRaw: 'getdate()' })
  createdAt!: Opt<Date>;
}

@Entity({ tableName: 'tpt_child' })
class TptChild extends TptBase {
  @Property()
  childValue!: string;
}

describe('TPT (Table-Per-Type) Inheritance [mssql]', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    const dbName = `mikro_orm_test_tpt_${(Math.random() + 1).toString(36).substring(2)}`;
    orm = await MikroORM.init({
      driver: MsSqlDriver,
      metadataProvider: ReflectMetadataProvider,
      dbName,
      password: 'Root.Root',
      entities: [TptBase, TptChild],
      debug: true,
      logger: i => i,
    });
    await orm.schema.create();
  }, 120_000);

  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  }, 120_000);

  test('nativeInsertMany OUTPUT clause only includes own table columns', async () => {
    const driver = orm.em.getDriver();
    const mock = mockLogger(orm, ['query']);

    // Insert into parent table first
    const parentResult = await driver.nativeInsertMany(TptBase, [
      { baseName: 'child 1' },
      { baseName: 'child 2' },
      { baseName: 'child 3' },
    ]);

    // Parent table INSERT should include OUTPUT for autoincrement id and defaultRaw createdAt
    expect(mock.mock.calls[0][0]).toMatch('insert into [tpt_base]');
    expect(mock.mock.calls[0][0]).toMatch('output inserted.[id], inserted.[created_at]');

    // Insert into child table
    await driver.nativeInsertMany(TptChild, [
      { id: parentResult.rows![0].id, childValue: 'val1' },
      { id: parentResult.rows![1].id, childValue: 'val2' },
      { id: parentResult.rows![2].id, childValue: 'val3' },
    ]);

    // Child table INSERT should NOT include parent-only columns (created_at) in OUTPUT
    const childInsertCall = mock.mock.calls.find(c => c[0].includes('[tpt_child]'));
    expect(childInsertCall).toBeDefined();
    expect(childInsertCall![0]).toMatch('insert into [tpt_child]');
    expect(childInsertCall![0]).not.toMatch('inserted.[created_at]');
  });
});
