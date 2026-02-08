import { Collection, EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers.js';

// Case 1: No explicit tableName - should use className
class PersonImplicit {
  id!: number;
  friends = new Collection<PersonImplicit>(this);
}

const PersonImplicitSchema = new EntitySchema<PersonImplicit>({
  class: PersonImplicit,
  // NO tableName - should derive from className
  properties: {
    id: { type: 'number', primary: true },
    friends: { kind: 'm:n', entity: () => PersonImplicit, owner: true },
  },
});

// Case 2: Explicit tableName - should use tableName
class PersonExplicit {
  id!: number;
  friends = new Collection<PersonExplicit>(this);
}

const PersonExplicitSchema = new EntitySchema<PersonExplicit>({
  class: PersonExplicit,
  tableName: 'people', // explicit tableName
  properties: {
    id: { type: 'number', primary: true },
    friends: { kind: 'm:n', entity: () => PersonExplicit, owner: true },
  },
});

describe('GH #7123', () => {
  test('self-ref m:n without explicit tableName should use className', async () => {
    const orm = await MikroORM.init({
      entities: [PersonImplicitSchema],
      dbName: '7123-1',
    });

    const sql = await orm.schema.getCreateSchemaSQL();

    // Without explicit tableName, should use className 'PersonImplicit' -> 'person_implicit_1_id'
    expect(sql).toContain('person_implicit_1_id');
    expect(sql).toContain('person_implicit_2_id');

    await orm.close();
  });

  test('self-ref m:n with explicit tableName should use tableName', async () => {
    const orm = await MikroORM.init({
      entities: [PersonExplicitSchema],
      dbName: '7123-2',
    });

    const sql = await orm.schema.getCreateSchemaSQL();

    // With explicit tableName: 'people', should use 'people_1_id', 'people_2_id'
    expect(sql).toContain('people_1_id');
    expect(sql).toContain('people_2_id');

    await orm.close();
  });

  test('self-ref m:n with STI should propagate joinColumns to child entities', async () => {
    // STI base class
    class BaseContent {
      pid!: string;
      catalogName!: string;
      catalogLanguage!: string;
      type!: string;
      relatedContents = new Collection<BaseContent>(this);
    }

    class Article extends BaseContent {}

    const ContentSchema = new EntitySchema<BaseContent>({
      name: 'Content',
      class: BaseContent,
      abstract: true,
      tableName: 'contents',
      discriminatorColumn: 'type',
      properties: {
        pid: { type: 'string', primary: true },
        catalogName: { type: 'string', primary: true },
        catalogLanguage: { type: 'string', primary: true },
        type: { type: 'string' },
        relatedContents: { kind: 'm:n', entity: () => BaseContent, owner: true },
      },
    });

    const ArticleSchema = new EntitySchema<Article, BaseContent>({
      class: Article,
      extends: ContentSchema,
      discriminatorValue: 'article',
    });

    const orm = await MikroORM.init({
      entities: [ContentSchema, ArticleSchema],
      dbName: '7123-3',
    });
    await orm.schema.refresh();

    const mock = mockLogger(orm);

    const content1 = new Article();
    content1.pid = 'pid1';
    content1.catalogName = 'catalog1';
    content1.catalogLanguage = 'en';

    const content2 = new Article();
    content2.pid = 'pid2';
    content2.catalogName = 'catalog1';
    content2.catalogLanguage = 'en';

    content1.relatedContents.add(content2);

    orm.em.persist([content1, content2]);
    await orm.em.flush();

    // Find the pivot table insert - should use contents_1_pid (from explicit tableName)
    const insertCall = mock.mock.calls.find(call => call[0].includes('contents_related_contents'));
    expect(insertCall).toBeDefined();
    expect(insertCall![0]).toContain('contents_1_pid');
    expect(insertCall![0]).toContain('contents_2_pid');

    // Verify child entity has same joinColumns as parent
    const contentMeta = orm.getMetadata(BaseContent);
    const articleMeta = orm.getMetadata(Article);
    expect(articleMeta.properties.relatedContents.joinColumns).toEqual(
      contentMeta.properties.relatedContents.joinColumns,
    );
    expect(articleMeta.properties.relatedContents.inverseJoinColumns).toEqual(
      contentMeta.properties.relatedContents.inverseJoinColumns,
    );

    await orm.close(true);
  });
});
