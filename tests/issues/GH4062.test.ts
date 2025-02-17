import {
  MikroORM,
  Cascade,
  Collection,
  Entity,
  EntityData,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  PrimaryKeyProp,
  Property,
  Ref,
  SimpleLogger,
  sql,
} from '@mikro-orm/mysql';
import { mockLogger } from '../helpers.js';

@Entity()
class Category {

  @PrimaryKey()
  id!: string;

  @OneToMany(() => Article, attr => attr.category, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  articles = new Collection<Article>(this);

  @Property({ default: sql.now() })
  createdAt?: Date;

}

@Entity()
class Article {

  @PrimaryKey()
  id!: string;

  @ManyToOne(() => Category, {
    primary: true,
    ref: true,
  })
  category!: Ref<Category>;

  [PrimaryKeyProp]?: ['id', 'category'];

  @OneToMany(() => ArticleAttribute, attr => attr.article, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  attributes = new Collection<ArticleAttribute>(this);

  @Property({
    default: sql.now(),
  })
  createdAt?: Date;

}

@Entity()
class ArticleAttribute {

  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @ManyToOne(() => Article, {
    primary: true,
    ref: true,
  })
  article!: Ref<Article>;

  [PrimaryKeyProp]?: ['id', ['id', 'category']];

  @Property({
    default: sql.now(),
  })
  createdAt?: Date;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = MikroORM.initSync({
    entities: [Category],
    dbName: `mikro_orm_4062`,
    port: 3308,
    loggerFactory: SimpleLogger.create,
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('4062', async () => {
  const category = new Category();
  category.id = 'category1';

  const article = new Article();
  article.id = 'article1';
  category.articles.add(article);

  const articleAttribute = new ArticleAttribute();
  articleAttribute.id = 'articleAttribute1';
  articleAttribute.name = 'nameBeforeUpdate';
  article.attributes.add(articleAttribute);

  await orm.em.persistAndFlush(category);
  orm.em.clear();

  const plainUpdate: EntityData<Category> = {
    articles: [
      {
        id: article.id,
        category: category.id,
        attributes: [
          {
            id: articleAttribute.id,
            article: [article.id, category.id],
            name: 'nameAfterUpdate',
          },
          {
            id: 'articleAttribute2',
            article: [article.id, category.id],
            name: 'secondNameAfterUpdate',
          },
        ],
      },
      {
        id: 'article2',
        category: category.id,
      },
    ],
  };

  const loaded = await orm.em.findOneOrFail(
    Category,
    { id: category.id },
    { populate: ['*'] },
  );
  // type-safe populate: ['*']
  const a = loaded.articles.$[0].category.$.articles.$[0].category.$.articles.$[0].category.$.articles.$[0].category.$;
  expect(a).toBe(loaded);

  orm.em.assign(loaded, plainUpdate);

  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ["[query] insert into `article` (`id`, `category_id`) values ('article2', 'category1')"],
    ["[query] select `a0`.`id`, `a0`.`category_id`, `a0`.`created_at` from `article` as `a0` where (`a0`.`id`, `a0`.`category_id`) in (('article2', 'category1'))"],
    ["[query] insert into `article_attribute` (`id`, `article_id`, `article_category_id`, `name`) values ('articleAttribute2', 'article1', 'category1', 'secondNameAfterUpdate')"],
    ["[query] select `a0`.`id`, `a0`.`article_id`, `a0`.`article_category_id`, `a0`.`created_at` from `article_attribute` as `a0` where (`a0`.`id`, `a0`.`article_id`, `a0`.`article_category_id`) in (('articleAttribute2', 'article1', 'category1'))"],
    ["[query] update `article_attribute` set `name` = 'nameAfterUpdate' where `id` = 'articleAttribute1' and (`article_id`, `article_category_id`) = ('article1', 'category1')"],
    ['[query] commit'],
  ]);
});
