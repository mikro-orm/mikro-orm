import { MikroORM } from '@mikro-orm/mssql';
import { Entity, Enum, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Section {
  @PrimaryKey({ columnType: 'char(4)' })
  id!: string;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ type: 'string', columnType: 'char(6)' })
  code!: string;

  @Property({ columnType: 'char(6)' })
  shelf!: string;

  @Property({ columnType: 'nchar(6)' })
  aisle!: string;

  @Property({ columnType: 'varchar(20)' })
  isbn!: string;

  @Property({ columnType: 'nvarchar(20)' })
  author!: string;

  @Property({ columnType: 'text' })
  summary!: string;

  @Property({ columnType: 'ntext' })
  notes!: string;

  @Enum({ items: ['draft', 'published'] })
  status!: string;

  @ManyToOne(() => Section)
  section!: Section;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [Book, Section],
    dbName: 'mikro_orm_test_gh_8740',
    password: 'Root.Root',
  });
  await orm.schema.refresh();
});

beforeEach(async () => {
  await orm.schema.clear();
  await orm.em.insert(Section, { id: 'SEC1' });
  await orm.em.insert(Book, {
    id: 1,
    title: 't',
    code: 'ABC123',
    shelf: 'S1',
    aisle: 'A1',
    isbn: '123',
    author: 'a',
    summary: 's',
    notes: 'n',
    status: 'draft',
    section: 'SEC1',
  });
});

afterAll(() => orm.close(true));

test('GH #8740 — string properties with an explicit column type are clean after load', async () => {
  const em = orm.em.fork();
  const book = await em.findOneOrFail(Book, 1);
  expect(book).toMatchObject({ code: 'ABC123', shelf: 'S1    ', aisle: 'A1    ' });
  em.getUnitOfWork().computeChangeSets();
  expect(
    em
      .getUnitOfWork()
      .getChangeSets()
      .map(cs => cs.payload),
  ).toEqual([]);
});

test('GH #8740 — only the changed char(n) property is updated', async () => {
  const em = orm.em.fork();
  const book = await em.findOneOrFail(Book, 1);
  book.shelf = 'S2';
  em.getUnitOfWork().computeChangeSets();
  expect(
    em
      .getUnitOfWork()
      .getChangeSets()
      .map(cs => Object.keys(cs.payload)),
  ).toEqual([['shelf']]);
  await em.flush();

  const reloaded = await orm.em.fork().findOneOrFail(Book, 1);
  expect(reloaded).toMatchObject({ code: 'ABC123', shelf: 'S2    ' });
});
