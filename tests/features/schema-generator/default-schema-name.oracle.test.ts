import { MikroORM, OracleDriver, OraclePlatform, type Options } from '@mikro-orm/oracledb';

async function init(options: Partial<Options>) {
  return MikroORM.init({
    driver: OracleDriver,
    entities: [],
    dbName: 'mikro_orm_test',
    password: 'oracle123',
    discovery: { warnWhenNoEntities: false },
    connect: false,
    ...options,
  } as Options);
}

describe('default schema name [oracle]', () => {
  test('falls back to dbName when no user is configured', async () => {
    const orm = await init({});
    expect(orm.em.getPlatform().getDefaultSchemaName()).toBe('mikro_orm_test');
    await orm.close(true);
  });

  test('uses the connection user when it differs from dbName', async () => {
    const orm = await init({ user: 'app_user' });
    const platform = orm.em.getPlatform() as OraclePlatform;
    expect(platform.getDefaultSchemaName()).toBe('app_user');
    expect(platform.getSchemaHelper()!.getListTablesSQL()).toContain(`at.owner = 'app_user'`);
    await orm.close(true);
  });
});
