import { Entity, Ref, Index, ManyToOne, MikroORM, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity({ tableName: 'book' })
export class Book1 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { wrappedReference: true })
  author1!: Ref<Author>;

  @ManyToOne(() => Author, { wrappedReference: true })
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

}

@Entity({ tableName: 'book' })
@Index({ properties: 'author1' })
@Index({ properties: 'author3' })
@Index({ name: 'custom_index_expr123', expression: 'create  index  "custom_index_expr123" on "book" ("isbn")' })
export class Book2 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { wrappedReference: true })
  author1!: Ref<Author>;

  @ManyToOne(() => Author, { wrappedReference: true })
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

}

@Entity({ tableName: 'book' })
@Index({ properties: 'author1' })
@Index({ properties: 'author3', name: 'lol31' })
@Index({ properties: 'author3', name: 'lol41' })
@Index({ name: 'custom_index_expr123', expression: 'create  index  "custom_index_expr123" on "book" ("isbn")' })
export class Book3 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { wrappedReference: true })
  author1!: Ref<Author>;

  @ManyToOne(() => Author, { wrappedReference: true })
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
  @Unique()
  isbn!: string;

}

@Entity({ tableName: 'book' })
@Index({ properties: 'author1' })
@Index({ properties: 'author3', name: 'lol32' })
@Index({ properties: 'author3', name: 'lol42' })
export class Book4 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { wrappedReference: true })
  author1!: Ref<Author>;

  @ManyToOne(() => Author, { wrappedReference: true })
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
  @Unique()
  isbn!: string;

}

describe('indexes on FKs in postgres (GH 1518)', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author],
      dbName: `mikro_orm_test_gh_1518`,
      driver: PostgreSqlDriver,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists author cascade');
    await orm.schema.execute('drop table if exists book cascade');
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema generator respect indexes on FKs on column update', async () => {
    await orm.discoverEntity(Book1);
    orm.getMetadata().reset('Book0');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1);

    orm.getMetadata().reset('Book1');
    await orm.discoverEntity(Book2);
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2);

    orm.getMetadata().reset('Book2');
    await orm.discoverEntity(Book3);
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toMatchSnapshot();
    await orm.schema.execute(diff3);

    orm.getMetadata().reset('Book3');
    await orm.discoverEntity(Book4);
    const diff4 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff4).toMatchSnapshot();
    await orm.schema.execute(diff4);
  });

});
