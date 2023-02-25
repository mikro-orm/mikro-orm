import { Cascade, Collection, Entity, EntityData, ManyToOne, OneToMany, PrimaryKey, PrimaryKeyType, Property, Ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';

@Entity()
class Category {

  @PrimaryKey()
  id!: string;

  @OneToMany(() => Article, attr => attr.category, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  articles = new Collection<Article>(this);

  @Property({ defaultRaw: 'CURRENT_TIMESTAMP' })
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

  [PrimaryKeyType]?: [string, string];

  @OneToMany(() => ArticleAttribute, attr => attr.article, {
    cascade: [Cascade.ALL],
    orphanRemoval: true,
  })
  attributes = new Collection<ArticleAttribute>(this);

  @Property({
    defaultRaw: 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

}

@Entity()
class ArticleAttribute {

  @PrimaryKey()
  id!: string;

  @ManyToOne(() => Article, {
    primary: true,
    ref: true,
  })
  article!: Ref<Article, 'id' | 'category'>;

  [PrimaryKeyType]?: [string, [string, string]];

  @Property({
    defaultRaw: 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Category],
    dbName: `mikro_orm_4062`,
    port: 3308,
    debug: true,
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
          },
          {
            id: 'articleAttribute2',
            article: [article.id, category.id],
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
    { populate: true },
  );

  orm.em.assign(loaded, plainUpdate);
  await orm.em.flush();
});
