import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { MikroORM } from '@mikro-orm/sqlite';
import { MetadataStorage } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

abstract class BaseEntity7389 {
  @Property({ type: 'datetime', onCreate: () => new Date() })
  createdAt!: Date;

  @Property()
  createdBy!: string;
}

@Entity()
class Task7389 extends BaseEntity7389 {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;
}

// Fix entity path for vitest — lookupPathFromDecorator cannot parse
// ES decorator call stacks produced by esbuild, so PATH_SYMBOL falls
// back to the bare class name. Patch it to the real file path so that
// TsMorphMetadataProvider can locate the source.
const testPath = import.meta.filename;
const oldPath = (Task7389 as any)[MetadataStorage.PATH_SYMBOL] as string;
const oldMeta = MetadataStorage.getMetadata(Task7389.name, oldPath);
(Task7389 as any)[MetadataStorage.PATH_SYMBOL] = testPath;
Object.assign(MetadataStorage.getMetadata(Task7389.name, testPath), oldMeta, { path: testPath });

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Task7389],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('#7389', async () => {
  const meta = orm.getMetadata().get(Task7389);
  expect(meta.properties.createdBy.type).toBe('string');
  expect(meta.properties.createdAt.type).toBe('datetime');
  expect(meta.properties.title.type).toBe('string');
});
