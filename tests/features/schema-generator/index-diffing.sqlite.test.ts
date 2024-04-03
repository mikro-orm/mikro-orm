import { Entity, Ref, Index, ManyToOne, MikroORM, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

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
@Index({ properties: 'metaData.foo.bar.baz', options: { returning: 'char(200)' } })
@Index({ properties: ['author1', 'metaData.foo.bar.baz'], options: { returning: 'char(200)' } })
@Unique({ properties: 'metaData.fooBar.email' })
export class Book2 {

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
@Index({ properties: ['metaData.foo.bar2', 'metaData.foo.bar3'] })
@Index({ properties: ['metaData.foo.bar.baz', 'author1'], options: { returning: 'char(200)' } })
@Unique({ properties: ['metaData.fooBar.bazBaz', 'metaData.fooBar.lol123'] })
export class Book3 {

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
  @Unique()
  isbn!: string;

  @Property({ type: 'json' })
  metaData: any;

}

@Entity({ tableName: 'book' })
@Index({ properties: 'author1' })
@Index({ properties: 'author3', name: 'lol32' })
@Index({ properties: 'author3', name: 'lol42' })
export class Book4 {

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
  @Unique()
  isbn!: string;

  @Property({ type: 'json' })
  metaData: any;

}

describe('indexes on FKs in postgres (GH 1518)', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author],
      dbName: `:memory:`,
      driver: SqliteDriver,
    });

    await orm.schema.refreshDatabase({ dropDb: true });
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
