import { Collection, Entity, Property, ManyToOne, OneToMany, PrimaryKey, PrimaryKeyType, Cascade, Ref } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';
import { randomUUID } from 'crypto';

@Entity()
export class Category {

  @PrimaryKey({
    length: 36,
  })
  id!: string;

  @Property({
    defaultRaw: 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @OneToMany(() => Article, attr => attr.category, {
    cascade: [Cascade.ALL],
  })
  articles = new Collection<Article>(this);

}

@Entity()
export class Article {

  @PrimaryKey({
    length: 36,
  })
  id!: string;

  @Property({
    defaultRaw: 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @ManyToOne(() => Category, {
    primary: true,
    ref: true,
  })
  category!: Ref<Category>;

  [PrimaryKeyType]?: [string, string];

  @OneToMany(() => ArticleAttribute, attr => attr.article, {
    cascade: [Cascade.ALL],
  })
  attributes = new Collection<ArticleAttribute>(this);

}

@Entity()
export class ArticleAttribute {

  @PrimaryKey({ length: 36 })
  id!: string;

  @Property({
    defaultRaw: 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @ManyToOne(() => Article, {
    primary: true,
    ref: true,
  })
  article!: Ref<Article>;

  [PrimaryKeyType]?: [string, [string, string]];

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_3965',
    entities: [Article],
    port: 3308,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('3965', async () => {
  const category = new Category();
  category.id = randomUUID();

  const article = new Article();
  article.id = randomUUID();

  category.articles.add(article);

  const articleAttribute = new ArticleAttribute();
  articleAttribute.id = randomUUID();

  article.attributes.add(articleAttribute);
  expect(category.createdAt).toBeUndefined();
  await orm.em.persistAndFlush(category);
  expect(category.createdAt).toBeDefined();
  expect(category.createdAt).toBeInstanceOf(Date);
});
