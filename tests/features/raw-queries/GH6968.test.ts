import { MikroORM, raw } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class RawIssue {

  @PrimaryKey({ fieldName: 'ID', type: 'integer' })
  id!: number;

  @Property({ type: 'Buffer', columnType: 'binary(16)' })
  uuid!: Buffer;

  @Property({
    fieldName: 'uuid_36',
    type: 'character',
    length: 36,
    generated: '(bin_to_uuid(`uuid`)) virtual',
    nullable: true,
  })
  uuid36?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [RawIssue],
    dbName: '6968',
    port: 3308,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #6968', async () => {
  const entry = new RawIssue();
  entry.uuid = raw(`UUID_TO_BIN('548523b4-0d09-4f4e-8ad6-df12002054b5')`);
  orm.em.persist(entry);
  await orm.em.flush();

  expect(entry.uuid).toEqual(Buffer.from('548523b40d094f4e8ad6df12002054b5', 'hex'));
  expect(entry.uuid36).toBe('548523b4-0d09-4f4e-8ad6-df12002054b5');
});
