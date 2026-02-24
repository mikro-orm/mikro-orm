import { Entity, ManyToOne, PrimaryKey, Property, MikroORM, rel } from '@mikro-orm/sqlite';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity()
class Article {

  @PrimaryKey()
  id!: number;

  @Property()
  slug!: string;

  @ManyToOne(() => Author, { accessor: 'authorId' })
  author!: Author;

  get authorId(): number {
    return this.author?.id;
  }

  set authorId(val: number) {
    this.author = rel(Author, val);
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Article],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close());

test('schema should have correct FK constraint', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toContain('`author_id` integer not null');
  expect(sql).toContain('foreign key(`author_id`) references `author`(`id`) on update cascade');
});

test('em.create with authorId via accessor', async () => {
  const author = orm.em.create(Author, { name: 'Author 1' });
  await orm.em.flush();
  orm.em.clear();

  const article = orm.em.create(Article, { slug: 'foo', authorId: author.id }, { partial: true });
  await orm.em.flush();

  orm.em.clear();
  const found = await orm.em.findOneOrFail(Article, { slug: 'foo' }, { populate: ['author'] });
  expect(found.author.id).toBe(author.id);
  expect(found.author.name).toBe('Author 1');
});
