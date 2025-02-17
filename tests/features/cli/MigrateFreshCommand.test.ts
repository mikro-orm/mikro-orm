(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SeedManager } from '@mikro-orm/seeder';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory.js';
import { initORMSqlite } from '../../bootstrap.js';

describe('MigrateUpCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('fresh');
    const args = { option: vi.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
    vi.spyOn(CLIHelper, 'showHelp').mockImplementation(() => void 0);
    const up = vi.spyOn(Migrator.prototype, 'up');
    up.mockResolvedValue([]);
    const dumpMock = vi.spyOn(CLIHelper, 'dump');
    dumpMock.mockImplementation(() => void 0);
    const dropSchema = vi.spyOn(SchemaGenerator.prototype, 'dropSchema');
    dropSchema.mockImplementation(async () => void 0);
    const seed = vi.spyOn(SeedManager.prototype, 'seedString');
    seed.mockImplementation(async () => void 0);
    vi.spyOn(CLIHelper, 'dumpTable').mockImplementation(() => void 0);

    const cmd = MigrationCommandFactory.create('fresh');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dropSchema).toHaveBeenCalledTimes(1);
    expect(up).toHaveBeenCalledTimes(1);
    expect(seed).toHaveBeenCalledTimes(0);
    expect(closeSpy).toHaveBeenCalledTimes(1);

    await expect(cmd.handler({ seed: '' } as any)).resolves.toBeUndefined();
    expect(dropSchema).toHaveBeenCalledTimes(2);
    expect(up).toHaveBeenCalledTimes(2);
    expect(seed).toHaveBeenCalledTimes(1);
    expect(seed).toHaveBeenCalledWith(orm.config.get('seeder').defaultSeeder);
    expect(closeSpy).toHaveBeenCalledTimes(2);

    await expect(cmd.handler({ seed: 'UsersSeeder' } as any)).resolves.toBeUndefined();
    expect(dropSchema).toHaveBeenCalledTimes(3);
    expect(up).toHaveBeenCalledTimes(3);
    expect(seed).toHaveBeenCalledTimes(2);
    expect(seed).toHaveBeenCalledWith('UsersSeeder');
    expect(closeSpy).toHaveBeenCalledTimes(3);
  });

});
