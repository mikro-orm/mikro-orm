import {
  Collection,
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Cascade,
  Ref,
  PrimaryKeyProp,
  sql,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';
import { randomUUID } from 'node:crypto';

@Entity()
class Category {

  @PrimaryKey({
    length: 36,
  })
  id!: string;

  @Property({
    length: 3,
    default: sql.now(3),
  })
  createdAt?: Date;

  @OneToMany(() => Article, attr => attr.category, {
    cascade: [Cascade.ALL],
  })
  articles = new Collection<Article>(this);

}

@Entity()
class Article {

  @PrimaryKey({
    length: 36,
  })
  id!: string;

  @Property({
    length: 3,
    default: sql.now(3),
  })
  createdAt?: Date;

  @ManyToOne(() => Category, {
    primary: true,
    ref: true,
  })
  category!: Ref<Category>;

  [PrimaryKeyProp]?: ['id', 'category'];

  @OneToMany(() => ArticleAttribute, attr => attr.article, {
    cascade: [Cascade.ALL],
  })
  attributes = new Collection<ArticleAttribute>(this);

}

@Entity()
class ArticleAttribute {

  @PrimaryKey({ length: 36 })
  id!: string;

  @Property({
    length: 3,
    default: sql.now(3),
  })
  createdAt?: Date;

  @ManyToOne(() => Article, {
    primary: true,
    ref: true,
  })
  article!: Ref<Article>;

  [PrimaryKeyProp]?: ['id', 'article'];

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

  const miss = await orm.em.findOne(ArticleAttribute, ['a', ['1', '1']]);
  expect(miss).toBeNull();
});
