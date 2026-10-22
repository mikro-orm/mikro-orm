import { MikroORM, Opt, Type } from '@mikro-orm/sqlite';
import {
  Entity,
  Formula,
  ManyToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers.js';

// A type with an SQL conversion routes the select through the driver's formula path as well as the query builder's
class UpperType extends Type<string, string> {
  override convertToJSValueSQL(key: string): string {
    return `upper(${key})`;
  }
}

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Formula(alias => `(SELECT upper(${alias}.name))`)
  upperName!: Opt<string>;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ type: UpperType })
  code!: string;

  @Formula(alias => `(SELECT length(${alias}.title))`)
  titleLength!: Opt<number>;

  @ManyToOne(() => Author)
  author!: Author;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Author, Book],
  });
  await orm.schema.refresh();
  const author = orm.em.create(Author, { name: 'Bar' });
  orm.em.create(Book, { title: 'Foo', code: 'abc', author });
  await orm.em.flush();
});

afterAll(async () => {
  await orm.close(true);
});

test('a formula using the alias toString is selected once, with the alias quoted', async () => {
  const em = orm.em.fork();
  const mock = mockLogger(orm);
  const book = await em.findOneOrFail(Book, { title: 'Foo' });

  expect(book.titleLength).toBe(3);

  const query = mock.mock.calls[0][0] as string;
  expect(query.match(/SELECT length\(/g)).toHaveLength(1);
  expect(query).toMatch(/SELECT length\(`[^`]+`\.title\)/);
});

test('a joined formula using the alias toString quotes a reserved-word join alias', async () => {
  const em = orm.em.fork();
  const [book] = await em.createQueryBuilder(Book, 'b').leftJoinAndSelect('b.author', 'order').getResultList();

  expect(book.author.upperName).toBe('BAR');
});
