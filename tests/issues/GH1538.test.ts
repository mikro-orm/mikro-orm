import { BigIntType, Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Author {

  @PrimaryKey({ type: BigIntType, comment: 'PK' })
  id!: string;

  @Property({ nullable: true })
  name!: string;

  @OneToMany('Post', 'author', {
    orphanRemoval: true,
  })
  post = new Collection<Post>(this);

  @Property({ persist: false })
  postTotal?: number;

}

@Entity()
export class Post {

  @PrimaryKey({ type: BigIntType, comment: 'PK' })
  id!: string;

  @Property({ nullable: true })
  title!: string;

  @Property({ nullable: true })
  body!: string;

  @ManyToOne(() => Author)
  author!: Author;

}

describe('GH issue 1538', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author, Post],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test(`sub-queries with custom type PK (bigint)`, async () => {
    const knex = orm.em.getKnex();
    const qb1 = orm.em.createQueryBuilder(Post, 'b')
      .count('b.id', true)
      .where({ author: knex.ref('a.id') })
      .as('Author.postTotal');
    const qb2 = orm.em.createQueryBuilder(Author, 'a');
    qb2.select(['*', qb1]).orderBy({ postTotal: 'desc' });
    expect(qb2.getFormattedQuery()).toBe('select `a`.*, (select count(distinct `b`.`id`) as `count` from `post` as `b` where `b`.`author_id` = `a`.`id`) as `post_total` from `author` as `a` order by `post_total` desc');
  });

});
