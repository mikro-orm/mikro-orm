(global as any).process.env.FORCE_COLOR = 0;

import { Migrator } from '@mikro-orm/migrations';
import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { MigrationCommandFactory } from '../../../packages/cli/src/commands/MigrationCommandFactory';
import { initORMSqlite } from '../../bootstrap';

const close = jest.fn();
jest.spyOn(MikroORM.prototype, 'close').mockImplementation(close);
jest.spyOn(require('yargs'), 'showHelp').mockReturnValue('');
const getPendingMigrations = jest.spyOn(Migrator.prototype, 'getPendingMigrations');
getPendingMigrations.mockResolvedValue([{ file: '1' }]);
const dumpMock = jest.spyOn(CLIHelper, 'dump');
dumpMock.mockImplementation(() => void 0);
jest.spyOn(CLIHelper, 'dumpTable').mockImplementation(() => void 0);

describe('PendingMigrationsCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = jest.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = MigrationCommandFactory.create('pending');
    const args = { option: jest.fn() };
    cmd.builder(args as any);
  });

  test('handler', async () => {
    const cmd = MigrationCommandFactory.create('pending');

    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(getPendingMigrations.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);
  });

});
