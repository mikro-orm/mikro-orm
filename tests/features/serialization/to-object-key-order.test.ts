import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM, wrap } from '@mikro-orm/sqlite';

@Entity()
class Article {
  @PrimaryKey({ type: 'integer', serializedName: 'articleId' })
  id!: number;

  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'string', nullable: true })
  subtitle?: string;

  @Property({ type: 'string', nullable: true })
  body?: string;

  @Property({ type: 'string', persist: false })
  get slug() {
    return this.title?.toLowerCase();
  }

  cache = { unmapped: true };
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Article],
  });
  await orm.schema.create();
});

afterAll(() => orm.close(true));

test('toObject/toJSON/toPOJO emit the PK first, then mapped properties in metadata order, never ad-hoc keys', async () => {
  const em = orm.em.fork();
  const article = new Article();
  article.body = 'Body';
  article.subtitle = 'Sub';
  article.title = 'Title';
  article.id = 1;
  em.persist(article);
  await em.flush();

  const loaded = await orm.em.fork().findOneOrFail(Article, article.id);
  (loaded as any).adhoc = 'x';

  for (const a of [article, loaded]) {
    expect(JSON.stringify(wrap(a).toObject())).toBe(
      '{"articleId":1,"title":"Title","subtitle":"Sub","body":"Body","slug":"title"}',
    );
    expect(JSON.stringify(a)).toBe('{"articleId":1,"title":"Title","subtitle":"Sub","body":"Body","slug":"title"}');
    expect(JSON.stringify(wrap(a).toPOJO())).toBe(
      '{"id":1,"title":"Title","subtitle":"Sub","body":"Body","slug":"title"}',
    );
  }
});

test('mapped properties that are deleted or non-enumerable on the instance are skipped', async () => {
  const em = orm.em.fork();
  const article = new Article();
  article.id = 2;
  article.title = 'Two';
  article.subtitle = 'Sub';
  article.body = 'Body';
  em.persist(article);
  await em.flush();

  const a = await orm.em.fork().findOneOrFail(Article, article.id);
  delete a.subtitle;
  Object.defineProperty(a, 'body', { value: 'Body', enumerable: false, configurable: true });

  expect(JSON.stringify(wrap(a).toObject())).toBe('{"articleId":2,"title":"Two","slug":"two"}');
  expect(JSON.stringify(wrap(a).toPOJO())).toBe('{"id":2,"title":"Two","slug":"two"}');
});
