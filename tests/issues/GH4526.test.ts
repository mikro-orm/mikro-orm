import { BlobType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
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
    entities: [Something],
    dbName: `:memory:`,
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

it('sets keys from references', async () => {
  const sth = new Something();
  sth.fileContent = Buffer.alloc(5_000_000);
  await orm.em.persistAndFlush(sth);
});
