import { Collection, EntitySchema, MikroORM } from '@mikro-orm/postgresql';
import { mockLogger } from '../helpers';

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

describe('GH #7123', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [ContentSchema, ArticleSchema],
      dbName: '7123',
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm?.schema.dropDatabase();
    await orm?.close(true);
  });

  test('self-referencing m:n with composite pk and STI should use consistent column names', async () => {
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

    // Find the pivot table insert
    const insertCall = mock.mock.calls.find(call => call[0].includes('contents_related_contents'));
    expect(insertCall).toBeDefined();

    expect(insertCall![0]).toContain('base_content_1_pid');
    expect(insertCall![0]).toContain('base_content_2_pid');

    const contentMeta = orm.getMetadata(BaseContent);
    const articleMeta = orm.getMetadata(Article);
    expect(articleMeta.properties.relatedContents.joinColumns).toEqual(contentMeta.properties.relatedContents.joinColumns);
    expect(articleMeta.properties.relatedContents.inverseJoinColumns).toEqual(contentMeta.properties.relatedContents.inverseJoinColumns);
  });
});
