import { MikroORM, Opt, Type } from '@mikro-orm/sqlite';
import { Entity, Formula, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../helpers';

// A type with an SQL conversion sends the select down the driver's formula path as well as
// the query builder's, which is what made the same formula appear twice.
class UpperType extends Type<string, string> {
  override convertToJSValueSQL(key: string): string {
    return `upper(${key})`;
  }
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ type: UpperType })
  code!: string;

  // Interpolating the mapping object itself relies on its `toString`, which is how formulas
  // were written before the object carried per-column entries.
  @Formula(alias => `(SELECT length(${alias}.title))`)
  titleLength!: Opt<number>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [Book],
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('a formula using the alias toString is selected once, with the alias quoted', async () => {
  orm.em.create(Book, { title: 'Foo', code: 'abc' });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);
  const book = await orm.em.findOneOrFail(Book, { title: 'Foo' });

  expect(book.titleLength).toBe(3);

  const query = mock.mock.calls[0][0] as string;
  expect(query.match(/SELECT length\(/g)).toHaveLength(1);
  expect(query).toMatch(/SELECT length\(`[^`]+`\.title\)/);
});
