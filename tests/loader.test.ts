import { join } from 'node:path';

import { requireDefault, createLoader, LoaderName } from '../packages/core/src/utils/loader';

import { Settings } from '@mikro-orm/core';

describe('requireDefault', () => {
  test('returns a value from default property', () => {
    expect(requireDefault({ default: 'foo' })).toBe('foo');
  });

  test('returns value as is if no default property exist', () => {
    expect(requireDefault({ test: 'foo' })).toEqual({ test: 'foo' });
  });
});

describe('createLoader', () => {
  describe('backwards compatibility', () => {
    const native: LoaderName = 'native';
    const tsNode: LoaderName = 'ts-node';

    interface TestOption {
      name: keyof Settings;
      value: boolean;
      expectedLoader: LoaderName;
    }

    const options: TestOption[] = [
      {
        name: 'alwaysAllowTs',
        value: false,
        expectedLoader: tsNode,
      },
      {
        name: 'alwaysAllowTs',
        value: true,
        expectedLoader: native,
      },
      {
        name: 'preferTs',
        value: false,
        expectedLoader: native,
      },
      {
        name: 'preferTs',
        value: true,
        expectedLoader: tsNode,
      },
      {
        name: 'useTsNode',
        value: false,
        expectedLoader: native,
      },
      {
        name: 'useTsNode',
        value: true,
        expectedLoader: tsNode,
      },
    ];

    options.forEach(({ name, value, expectedLoader }) => {
      test(`returns ${expectedLoader} when ${name} is "${value}"`, async () => {
        const loader = await createLoader(process.cwd(), { [name]: value });

        expect(loader.name).toBe(expectedLoader);
      });
    });
  });

  test('returns ts-node loader when called w/o loader option', async () => {
    const expected: LoaderName = 'ts-node';
    const loader = await createLoader(process.cwd(), {});

    expect(loader.name).toBe(expected);
  });

  const loaders: readonly LoaderName[] = ['ts-node', 'jiti', 'tsx', 'native'];
  const extnames = ['.ts', '.js'] as const;

  describe('loader option', () => {
    loaders.forEach(name => {
      test(name, async () => {
        const loader = await createLoader(process.cwd(), { loader: name });

        expect(loader.name).toBe(name);
      });
    });
  });

  loaders
    .filter(name => name !== 'tsx') // TODO: resolve the issue with tsx loader in Jest
    .forEach(name => describe(`${name} loader`, () => {
      extnames.forEach(extname => test(`reads config from ${extname}`, async () => {
        const root = join(__dirname, 'configs');
        const path = join(root, `mikro-orm.config${extname}`);

        const loader = await createLoader(root, { loader: name });
        const expected = requireDefault(await import(path));
        const actual = await loader.import(path);

        expect(actual).toMatchObject(expected);
      }));
    }));
});
