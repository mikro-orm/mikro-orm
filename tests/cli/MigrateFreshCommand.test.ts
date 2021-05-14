(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SeedManager } from '@mikro-orm/seeder';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
// noinspection ES6PreferShortImport
import { MigrationCommandFactory } from '../../packages/cli/src/commands/MigrationCommandFactory';
import { initORMSqlite } from '../bootstrap';

const close = jest.fn();
jest.spyOn(MikroORM.prototype, 'close').mockImplementation(close);
jest.spyOn(require('yargs'), 'showHelp').mockReturnValue('');
const up = jest.spyOn(Migrator.prototype, 'up');
up.mockResolvedValue([]);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);
const dropSchema = jest.spyOn(SchemaGenerator.prototype, 'dropSchema');
dropSchema.mockImplementation(async () => void 0);
const seed = jest.spyOn(SeedManager.prototype, 'seedString');
seed.mockImplementation(async () => void 0);
jest.spyOn(CLIHelper, 'dumpTable').mockImplementation(() => void 0);

describe('MigrateUpCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('fresh');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('fresh');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(dropSchema).toBeCalledTimes(1);
    expect(up).toBeCalledTimes(1);
    expect(seed).toBeCalledTimes(0);
    expect(close).toBeCalledTimes(1);

    await expect(cmd.handler({ seed: '' } as any)).resolves.toBeUndefined();
    expect(dropSchema).toBeCalledTimes(2);
    expect(up).toBeCalledTimes(2);
    expect(seed).toBeCalledTimes(1);
    expect(seed).toBeCalledWith(orm.config.get('seeder').defaultSeeder);
    expect(close).toBeCalledTimes(2);

    await expect(cmd.handler({ seed: 'UsersSeeder' } as any)).resolves.toBeUndefined();
    expect(dropSchema).toBeCalledTimes(3);
    expect(up).toBeCalledTimes(3);
    expect(seed).toBeCalledTimes(2);
    expect(seed).toBeCalledWith('UsersSeeder');
    expect(close).toBeCalledTimes(3);
  });

});
