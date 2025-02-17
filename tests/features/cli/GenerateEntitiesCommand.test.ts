import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { CLIHelper } from '@mikro-orm/cli';
import { GenerateEntitiesCommand } from '../../../packages/cli/src/commands/GenerateEntitiesCommand.js';
import { initORMSqlite } from '../../bootstrap.js';

describe('GenerateEntitiesCommand', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await initORMSqlite();
    const getORMMock = vi.spyOn(CLIHelper, 'getORM');
    getORMMock.mockResolvedValue(orm);
  });

  afterAll(async () => await orm.close(true));

  test('builder', async () => {
    const cmd = new GenerateEntitiesCommand();

    const args = { option: vi.fn() };
    cmd.builder(args as any);
    expect(args.option.mock.calls.length).toBe(4);
    expect(args.option.mock.calls[0][0]).toBe('s');
    expect(args.option.mock.calls[0][1]).toMatchObject({ alias: 'save', type: 'boolean' });
    expect(args.option.mock.calls[1][0]).toBe('d');
    expect(args.option.mock.calls[1][1]).toMatchObject({ alias: 'dump', type: 'boolean' });
    expect(args.option.mock.calls[2][0]).toBe('p');
    expect(args.option.mock.calls[2][1]).toMatchObject({ alias: 'path', type: 'string' });
  });

  test('handler', async () => {
    const closeSpy = vi.spyOn(MikroORM.prototype, 'close');
    const showHelpMock = vi.spyOn(CLIHelper, 'showHelp');
    showHelpMock.mockImplementation(() => void 0);
    const generate = vi.spyOn(EntityGenerator.prototype, 'generate');
    generate.mockImplementation(async () => []);
    const dumpMock = vi.spyOn(CLIHelper, 'dump');
    dumpMock.mockImplementation(() => void 0);

    const cmd = new GenerateEntitiesCommand();

    expect(showHelpMock.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(showHelpMock.mock.calls.length).toBe(1);

    expect(generate.mock.calls.length).toBe(0);
    expect(closeSpy).toHaveBeenCalledTimes(0);
    await expect(cmd.handler({ save: true } as any)).resolves.toBeUndefined();
    expect(generate.mock.calls.length).toBe(1);
    expect(closeSpy).toHaveBeenCalledTimes(1);

    await expect(cmd.handler({ dump: true } as any)).resolves.toBeUndefined();
    expect(generate.mock.calls.length).toBe(2);
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

});
