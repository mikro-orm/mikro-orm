import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/mysql';

@Entity()
class Author {

  @PrimaryKey({ columnType: 'mediumint' })
  id!: number;

  @Property()
  name!: string;

  @OneToMany(() => Book, book => book.author)
  books = new Collection<Book>(this);

}

@Entity()
class Book {

  @PrimaryKey({ columnType: 'mediumint' })
  bookId!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Author;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Author, Book],
    dbName: `mikro_orm_test_gh_3230`,
    port: 3308,
  });
  await orm.schema.ensureDatabase();
  await orm.schema.dropSchema();
});

afterAll(() => orm.close(true));

test('mediumint column type in mysql as FK', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();
  expect(sql).toMatchSnapshot();
  await orm.schema.execute(sql);
  const diff = await orm.schema.getUpdateSchemaSQL();
  expect(diff).toBe('');
});
