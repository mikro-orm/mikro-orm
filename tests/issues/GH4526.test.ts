import { BlobType } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Something {
  @PrimaryKey()
  id!: number;

  @Property({ type: BlobType })
  fileContent!: Buffer;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Something],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

it('sets keys from references', async () => {
  const sth = new Something();
  sth.fileContent = Buffer.alloc(5_000_000);
  await orm.em.persist(sth).flush();
});
