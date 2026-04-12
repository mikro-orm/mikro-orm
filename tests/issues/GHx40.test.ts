// GH #7544 - populate: ['*'] with refresh: true causes infinite loop / hang
import { Collection, Opt } from '@mikro-orm/core';
import {
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Author7544 {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ version: true, type: 'number' })
  version!: number & Opt;

  @OneToMany(() => Article7544, article => article.author)
  articles = new Collection<Article7544>(this);
}

@Entity()
class Article7544 {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author7544)
  author!: Author7544;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Author7544, Article7544],
    dbName: ':memory:',
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7544 - populate: [*] with refresh: true should not hang', async () => {
  const author = orm.em.create(Author7544, { name: 'John' });
  const article = orm.em.create(Article7544, { title: 'Test Article', author });
  await orm.em.flush();

  author.name = 'John (updated)';
  await orm.em.flush();

  orm.em.clear();

  const result = await orm.em.findOneOrFail(Article7544, article.id, {
    populate: ['*'],
    refresh: true,
  });

  expect(result.author.name).toBe('John (updated)');
  expect(result.author.version).toBe(2);
});
