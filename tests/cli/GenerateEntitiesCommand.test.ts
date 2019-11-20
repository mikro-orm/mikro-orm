import { Configuration } from '../../lib/utils';

const showHelp = jest.fn();
const close = jest.fn();
const entityGenerator = { generate: jest.fn(() => []) };
const config = new Configuration({} as any, false);
const getORM = async () => ({ getEntityGenerator: () => entityGenerator, config, close });
jest.mock('yargs', () => ({ showHelp }));
jest.mock('../../lib/cli/CLIHelper', () => ({ CLIHelper: { getORM, dump: jest.fn() } }));

import { GenerateEntitiesCommand } from '../../lib/cli/GenerateEntitiesCommand';

describe('GenerateEntitiesCommand', () => {

  test('builder', async () => {
    const cmd = new GenerateEntitiesCommand();

    const args = { option: jest.fn() };
    cmd.builder(args as any);
    expect(args.option.mock.calls.length).toBe(3);
    expect(args.option.mock.calls[0][0]).toBe('s');
    expect(args.option.mock.calls[0][1]).toMatchObject({ alias: 'save', type: 'boolean' });
    expect(args.option.mock.calls[1][0]).toBe('d');
    expect(args.option.mock.calls[1][1]).toMatchObject({ alias: 'dump', type: 'boolean' });
    expect(args.option.mock.calls[2][0]).toBe('p');
    expect(args.option.mock.calls[2][1]).toMatchObject({ alias: 'path', type: 'string' });
  });

  test('handler', async () => {
    const cmd = new GenerateEntitiesCommand();

    expect(showHelp.mock.calls.length).toBe(0);
    await expect(cmd.handler({} as any)).resolves.toBeUndefined();
    expect(showHelp.mock.calls.length).toBe(1);

    expect(entityGenerator.generate.mock.calls.length).toBe(0);
    expect(close.mock.calls.length).toBe(0);
    await expect(cmd.handler({ save: true } as any)).resolves.toBeUndefined();
    expect(entityGenerator.generate.mock.calls.length).toBe(1);
    expect(close.mock.calls.length).toBe(1);

    await expect(cmd.handler({ dump: true } as any)).resolves.toBeUndefined();
    expect(entityGenerator.generate.mock.calls.length).toBe(2);
    expect(close.mock.calls.length).toBe(2);
  });

});
