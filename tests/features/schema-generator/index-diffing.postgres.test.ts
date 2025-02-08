import { Entity, Ref, Index, ManyToOne, MikroORM, PrimaryKey, Property, Unique } from '@mikro-orm/postgresql';

@Entity()
class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity({ tableName: 'book' })
class Book1 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true })
  author1!: Ref<Author>;

  @ManyToOne(() => Author, { ref: true })
  author2!: Ref<Author>;

  @ManyToOne(() => Author)
  author3!: Author;

  @ManyToOne(() => Author)
  author4!: Author;

  @ManyToOne(() => Author)
  author5!: Author;

  @Property()
  title!: string;

  @Property({ unique: true })
  isbn!: string;

  @Property({ type: 'json' })
  metaData: any;

}

@Entity({ tableName: 'book' })
@Index({ properties: 'author1' })
@Index({ properties: 'author3' })
@Index({ properties: ['author3', 'metaData.foo.bar.baz'] })
@Unique({ properties: 'metaData.fooBar.email' })
@Index({ name: 'custom_index_expr123', expression: 'create index "custom_index_expr123" on "book" ("isbn")' })
class Book2 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true })
  author1!: Ref<Author>;

  @ManyToOne(() => Author, { ref: true })
  @Index()
  author2!: Ref<Author>;

  @ManyToOne(() => Author)
  author3!: Author;

  @ManyToOne(() => Author)
  @Index()
  author4!: Author;

  @ManyToOne(() => Author, { index: true })
  author5!: Author;

  @Index({ expression: 'create index "custom_index_expr" on "book" ("title")' })
  @Property()
  title!: string;

  @Property({ unique: 'isbn_unique_constr' })
  isbn!: string;

  @Property({ type: 'json' })
  metaData: any;

}

@Entity({ tableName: 'book' })
@Index({ properties: 'author1' })
@Index({ properties: 'author3', name: 'lol31' })
@Index({ properties: 'author3', name: 'lol41' })
@Index({ properties: ['metaData.foo', 'metaData.foo.bar3'] })
@Unique({ properties: ['metaData.fooBar.bazBaz', 'metaData.fooBar.lol123'] })
@Index({ name: 'custom_index_expr123', expression: 'create index "custom_index_expr123" on "book" ("isbn")' })
class Book3 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true })
  author1!: Ref<Author>;

  @ManyToOne(() => Author, { ref: true })
  @Index()
  author2!: Ref<Author>;

  @ManyToOne(() => Author)
  author3!: Author;

  @ManyToOne(() => Author)
  @Index()
  author4!: Author;

  @ManyToOne(() => Author, { index: 'auth_idx5' })
  author5!: Author;

  @Index({ name: 'custom_index_expr2', expression: 'create index "custom_index_expr2" on "book" ("title")' })
  @Property()
  title!: string;

  @Property()
  @Unique({ name: 'isbn_null', expression: 'create unique index isbn_null on "book" ("isbn") where "isbn" is not null' })
  isbn!: string;

  @Property({ type: 'json' })
  metaData: any;

}

@Entity({ tableName: 'book' })
@Index({ properties: 'author1' })
@Index({ properties: 'author3', name: 'lol32' })
@Index({ properties: 'author3', name: 'lol42' })
class Book4 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { ref: true })
  author1!: Ref<Author>;

  @ManyToOne(() => Author, { ref: true })
  @Index()
  author2!: Ref<Author>;

  @ManyToOne(() => Author)
  author3!: Author;

  @ManyToOne(() => Author)
  @Index()
  author4!: Author;

  @ManyToOne(() => Author, { index: 'auth_idx5' })
  author5!: Author;

  @Property()
  title!: string;

  @Property()
  @Unique({ name: 'isbn_null', expression: 'create unique index isbn_null on "book" ("isbn") where "isbn" is not null' })
  isbn!: string;

  @Property({ type: 'json' })
  metaData: any;

}

describe('indexes on FKs in postgres (GH 1518)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author],
      dbName: `mikro_orm_test_gh_1518`,
    });

    await orm.schema.refreshDatabase({ dropDb: true });
  });

  afterAll(() => orm.close(true));

  test('schema generator respect indexes on FKs on column update', async () => {
    orm.discoverEntity(Book1, 'Book0');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    orm.discoverEntity(Book2, 'Book1');
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2);

    orm.discoverEntity(Book3, 'Book2');
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toMatchSnapshot();
    await orm.schema.execute(diff3);

    orm.discoverEntity(Book4, 'Book3');
    const diff4 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff4).toMatchSnapshot();
    await orm.schema.execute(diff4);
  });

});
