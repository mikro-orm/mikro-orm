(global as any).process.env.FORCE_COLOR = 0;

import { MikroORM } from '@mikro-orm/core';
import { SeedManager } from '@mikro-orm/seeder';
import { SchemaGenerator, SqliteDriver } from '@mikro-orm/sqlite';
import { CLIHelper } from '@mikro-orm/cli';
import { SchemaCommandFactory } from '../../../packages/cli/src/commands/SchemaCommandFactory.js';
import { initORMSqlite } from '../../bootstrap.js';

describe('FreshSchemaCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('handler', async () => {
    const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
    const showHelpMock = vi.spyOn(CLIHelper, 'showHelp');
    showHelpMock.mockImplementation(() => void 0);
    const createSchema = vi.spyOn(SchemaGenerator.prototype, 'createSchema');
    createSchema.mockImplementation(async () => void 0);
    const dropSchema = vi.spyOn(SchemaGenerator.prototype, 'dropSchema');
    dropSchema.mockImplementation(async () => void 0);
    const seed = vi.spyOn(SeedManager.prototype, 'seedString');
    seed.mockImplementation(async () => void 0);
    const getDropSchemaSQL = vi.spyOn(SchemaGenerator.prototype, 'getDropSchemaSQL');
    getDropSchemaSQL.mockImplementation(async () => '');
    const dumpMock = vi.spyOn(CLIHelper, 'dump');
    dumpMock.mockImplementation(() => void 0);

    const cmd = SchemaCommandFactory.create('fresh');

    expect(showHelpMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(showHelpMock.mock.calls.length).toBe(1);

    expect(dropSchema.mock.calls.length).toBe(0);
    expect(createSchema.mock.calls.length).toBe(0);
    expect(dropSchema.mock.calls.length).toBe(0);
    expect(createSchema.mock.calls.length).toBe(0);
    expect(seed.mock.calls.length).toBe(0);
    expect(closeSpy).toHaveBeenCalledTimes(0);

    await expect(cmd.handler({ run: true } as any)).resolves.toBeUndefined();
    expect(dropSchema.mock.calls.length).toBe(1);
    expect(createSchema.mock.calls.length).toBe(1);
    expect(seed.mock.calls.length).toBe(0);
    expect(closeSpy).toHaveBeenCalledTimes(1);

    await expect(cmd.handler({ run: true, seed: '' } as any)).resolves.toBeUndefined();
    expect(dropSchema.mock.calls.length).toBe(2);
    expect(createSchema.mock.calls.length).toBe(2);
    expect(seed.mock.calls.length).toBe(1);
    expect(seed).toHaveBeenCalledWith(orm.config.get('seeder').defaultSeeder);
    expect(closeSpy).toHaveBeenCalledTimes(2);

    await expect(cmd.handler({ run: true, seed: 'UsersSeeder' } as any)).resolves.toBeUndefined();
    expect(dropSchema.mock.calls.length).toBe(3);
    expect(createSchema.mock.calls.length).toBe(3);
    expect(seed.mock.calls.length).toBe(2);
    expect(seed).toHaveBeenCalledWith('UsersSeeder');
    expect(closeSpy).toHaveBeenCalledTimes(3);
  });

});
