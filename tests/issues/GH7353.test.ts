import { MikroORM, Opt, Ref } from '@mikro-orm/core';
import { Entity, Index, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { FullTextType, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';

@Entity()
class Tag {
  @PrimaryKey({ type: 'text' })
  id!: string;

  @Property({ type: 'text' })
  label!: string;

  @Index({ type: 'fulltext' })
  @Property({
    type: FullTextType,
    lazy: true,
    ref: true,
  })
  searchablePropertiesVector!: Ref<string> & Opt;

  @Property({ length: 3 })
  creationDate: Date & Opt = new Date();

  @Property({ length: 3, onUpdate: () => new Date() })
  lastUpdated: Date & Opt = new Date();
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Tag],
    dbName: 'mikro_orm_test_7353',
    driver: PostgreSqlDriver,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH issue 7353', async () => {
  orm.em.create(Tag, {
    id: 'Test',
    label: 'Label',
    searchablePropertiesVector: 'Test Label',
  });
  await orm.em.flush();
  orm.em.clear();

  // Load without the lazy property
  const sameTag = await orm.em.findOneOrFail(Tag, { id: 'Test' });
  sameTag.label = 'NewLabel';

  const mock = mockLogger(orm);
  await orm.em.flush();

  // The update should only contain label and last_updated, not the unloaded lazy property
  expect(mock.mock.calls[1][0]).not.toMatch('searchable_properties_vector');
});
