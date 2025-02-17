(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory.js';
import { initORMSqlite } from '../../bootstrap.js';

describe('CreateMigrationCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('create');
    const args = { option: vi.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
    vi.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
    const createMigrationMock = vi.spyOn(Migrator.prototype, 'createMigration');
    createMigrationMock.mockResolvedValue({ fileName: '1', code: '2', diff: { up: ['3'], down: [] } });
    const dumpMock = vi.spyOn(CLIHelper, 'dump');
    dumpMock.mockImplementation(() => void 0);

    const cmd = MigrationCommandFactory.create('create');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(createMigrationMock.mock.calls.length).toBe(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);

    await expect(cmd.handler({ blank: true, dump: true } as any)).resolves.toBeUndefined();
    expect(createMigrationMock.mock.calls.length).toBe(2);
    expect(closeSpy).toHaveBeenCalledTimes(2);
    expect(dumpMock).toHaveBeenLastCalledWith('1 successfully created');

    createMigrationMock.mockImplementationOnce(async () => ({ fileName: '', code: '', diff: { up: [], down: [] } }));
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(createMigrationMock.mock.calls.length).toBe(3);
    expect(closeSpy).toHaveBeenCalledTimes(3);
    expect(dumpMock).toHaveBeenLastCalledWith('No changes required, schema is up-to-date');
  });

});
