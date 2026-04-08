import { fs } from '@mikro-orm/core/fs-utils';

test('GH #7509: glob() without cwd does not forward `cwd: undefined` to tinyglobby', async () => {
  await fs.init();
  expect(() => fs.glob('tests/issues/GH7509.test.ts')).not.toThrow();
});
