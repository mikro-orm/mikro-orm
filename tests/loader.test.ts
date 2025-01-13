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

  describe('loader option', () => {
    const loaders: readonly LoaderName[] = ['ts-node', 'jiti', 'tsx', 'native'];

    loaders.forEach(name => {
      test(name, async () => {
        const loader = await createLoader(process.cwd(), { loader: name });

        expect(loader.name).toBe(name);
      });
    });
  });
});
