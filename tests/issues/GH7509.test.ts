import { fs } from '@mikro-orm/core/fs-utils';

// reproduce tinyglobby >= 0.2.16, which throws on `cwd: undefined`
vi.mock('tinyglobby', () => ({
  globSync: (patterns: string[], options: { cwd?: string; expandDirectories?: boolean }) => {
    if ('cwd' in options && options.cwd === undefined) {
      throw new TypeError('The "paths[0]" argument must be of type string. Received undefined');
    }
    return [];
  },
}));

test('GH #7509: glob() without cwd does not forward `cwd: undefined` to tinyglobby', async () => {
  await fs.init();
  expect(() => fs.glob('tests/issues/GH7509.test.ts')).not.toThrow();
});
