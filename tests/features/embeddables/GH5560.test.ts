import {
  Entity,
  MikroORM,
  PrimaryKey,
  Property,
  Embeddable,
  ManyToOne,
  Embedded,
  OneToMany,
  Collection,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class AuthorEmbeddable {

  @Property()
  age: number;

  constructor(age: number) {
    this.age = age;
  }

}

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

  @Embedded(() => AuthorEmbeddable, { object: true })
  embeddable: AuthorEmbeddable;

  constructor(name: string, embeddable: AuthorEmbeddable) {
    this.name = name;
    this.embeddable = embeddable;
  }

}

@Entity()
class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title: string;

  @ManyToOne(() => Author)
  author: Author;

  constructor(title: string, author: Author) {
    this.title = title;
    this.author = author;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author],
    dbName: ':memory:',
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('5560', async () => {
  const mock = mockLogger(orm);
  await orm.em.fork().find(
    Author,
    {},
    { orderBy: [{ embeddable: { age: 'ASC' } }] },
  );
  expect(mock.mock.calls[0][0]).toMatch('select `a0`.* from `author` as `a0` order by json_extract(`a0`.`embeddable`, \'$.age\') asc');

  // This throws "column b0.embeddable_age does not exist"
  await orm.em.fork().find(
    Book,
    {},
    { orderBy: [{ author: { embeddable: { age: 'ASC' } } }] },
  );
  expect(mock.mock.calls[1][0]).toMatch('select `b0`.* from `book` as `b0` left join `author` as `a1` on `b0`.`author_id` = `a1`.`id` order by json_extract(`a1`.`embeddable`, \'$.age\') asc');
});
