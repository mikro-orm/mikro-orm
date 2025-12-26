import { Collection, MikroORM, t } from '@mikro-orm/sqlite';
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {

  @PrimaryKey({ type: t.integer })
  id!: number;

  @Property({ type: t.string })
  fullName!: string;

  @Property({ type: t.datetime })
  tdatetime: Date;

  @Property({ type: 'datetime' })
  qdatetime: Date;

  @Property({ type: 'Date' })
  qDate: Date;

  @Property({ type: Date })
  Date: Date;

  @OneToMany(() => Article, (article: Article) => article.author)
  articles = new Collection<Article>(this);

  constructor(fullName: string, date: Date) {
    this.fullName = fullName;
    this.tdatetime = date;
    this.qdatetime = date;
    this.qDate = date;
    this.Date = date;
  }

}

@Entity()
class Article {

  @PrimaryKey({ type: t.integer })
  id!: number;

  @Property({ type: t.string })
  title: string;

  @Property({ type: t.datetime })
  tdatetime: Date;

  @Property({ type: 'datetime' })
  qdatetime: Date;

  @Property({ type: 'Date' })
  qDate: Date;

  @Property({ type: Date })
  Date: Date;

  @ManyToOne(() => User)
  author: User;

  constructor(author: User, title: string, date: Date) {
    this.author = author;
    this.title = title;
    this.tdatetime = date;
    this.qdatetime = date;
    this.qDate = date;
    this.Date = date;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [User],
    dbName: ':memory:',
  });
  await orm.schema.refresh();
});

afterAll(() => orm.close(true));

test('5550', async () => {
  const user = new User('Foo Bar', new Date());
  user.articles.add(new Article(user, 'hello world', new Date()));
  await orm.em.persist(user).flush();
  const dbUser = await orm.em.fork().findOne(User, { id: 1 }, { populate: ['articles'] });
  expect(dbUser).toMatchObject({
    tdatetime: expect.any(Date),
    qdatetime: expect.any(Date),
    qDate: expect.any(Date),
    Date: expect.any(Date),
    id: 1,
  });
  expect(dbUser?.articles[0]).toMatchObject({
    title: 'hello world',
    tdatetime: expect.any(Date),
    qdatetime: expect.any(Date),
    qDate: expect.any(Date),
    Date: expect.any(Date),
    author: expect.any(User),
    id: 1,
  });
});
