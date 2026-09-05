import { rmSync } from 'node:fs';
import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { User as User1 } from './entities-dup-name/user1/User.js';
import { User as User2 } from './entities-dup-name/user2/User.js';
import { TEMP_DIR } from '../../helpers.js';

const cacheDir = TEMP_DIR + '/metadata-cache-dup-class-name';

function createORM() {
  return MikroORM.init({
    dbName: ':memory:',
    entities: [User1, User2],
    baseDir: import.meta.dirname,
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: true, options: { cacheDir } },
  });
}

afterAll(() => rmSync(cacheDir, { recursive: true, force: true }));

test('metadata cache ignores entries cached from a different file (duplicate class names)', async () => {
  rmSync(cacheDir, { recursive: true, force: true });

  // cold boot populates the cache, both classes share the cache key `User.ts`
  const orm1 = await createORM();
  expect(Object.keys(orm1.getMetadata().get(User1).properties)).toEqual(['id', 'email']);
  expect(Object.keys(orm1.getMetadata().get(User2).properties)).toEqual(['id', 'username']);
  await orm1.close(true);

  // warm boot must not serve one class the other's cached metadata
  const orm2 = await createORM();
  expect(orm2.getMetadata().get(User1).tableName).toBe('user1');
  expect(Object.keys(orm2.getMetadata().get(User1).properties)).toEqual(['id', 'email']);
  expect(orm2.getMetadata().get(User2).tableName).toBe('user2');
  expect(Object.keys(orm2.getMetadata().get(User2).properties)).toEqual(['id', 'username']);
  await orm2.close(true);
});
