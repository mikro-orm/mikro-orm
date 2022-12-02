import { Entity, IdentifiedReference, Index, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';

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
  author1!: IdentifiedReference<Author>;

  @ManyToOne(() => Author, { wrappedReference: true })
  author2!: IdentifiedReference<Author>;

  @ManyToOne(() => Author)
  author3!: Author;

  @ManyToOne(() => Author)
  author4!: Author;

  @ManyToOne(() => Author)
  author5!: Author;

  @Property()
  title!: string;

}

@Entity({ tableName: 'book' })
@Index({ properties: 'author1' })
@Index({ properties: 'author3' })
export class Book2 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { wrappedReference: true })
  author1!: IdentifiedReference<Author>;

  @ManyToOne(() => Author, { wrappedReference: true })
  @Index()
  author2!: IdentifiedReference<Author>;

  @ManyToOne(() => Author)
  author3!: Author;

  @ManyToOne(() => Author)
  @Index()
  author4!: Author;

  @ManyToOne(() => Author, { index: true })
  author5!: Author;

  @Index({ expression: 'alter table `book` add index `custom_index_expr`(`title`)' })
  @Property()
  title!: string;

}

@Entity({ tableName: 'book' })
@Index({ properties: 'author1' })
@Index({ properties: 'author3', name: 'lol31' })
@Index({ properties: 'author3', name: 'lol41' })
export class Book3 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { wrappedReference: true })
  author1!: IdentifiedReference<Author>;

  @ManyToOne(() => Author, { wrappedReference: true })
  @Index()
  author2!: IdentifiedReference<Author>;

  @ManyToOne(() => Author)
  author3!: Author;

  @ManyToOne(() => Author)
  @Index()
  author4!: Author;

  @ManyToOne(() => Author, { index: 'auth_idx5' })
  author5!: Author;

  @Index({ name: 'custom_index_expr2', expression: 'alter table `book` add index `custom_index_expr2`(`title`)' })
  @Property()
  title!: string;

}

@Entity({ tableName: 'book' })
@Index({ properties: 'author1' })
@Index({ properties: 'author3', name: 'lol32' })
@Index({ properties: 'author3', name: 'lol42' })
export class Book4 {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author, { wrappedReference: true })
  author1!: IdentifiedReference<Author>;

  @ManyToOne(() => Author, { wrappedReference: true })
  @Index()
  author2!: IdentifiedReference<Author>;

  @ManyToOne(() => Author)
  author3!: Author;

  @ManyToOne(() => Author)
  @Index()
  author4!: Author;

  @ManyToOne(() => Author, { index: 'auth_idx5' })
  author5!: Author;

  @Index({ name: 'custom_index_expr2', expression: 'alter table `book` add index `custom_index_expr2`(`title`)' })
  @Property()
  title!: string;

}

describe('indexes on FKs in mysql (GH 1518)', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author],
      dbName: `mikro_orm_test_gh_1518`,
      driver: MySqlDriver,
      port: 3308,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('set foreign_key_checks = 0');
    await orm.schema.execute('drop table if exists author');
    await orm.schema.execute('drop table if exists book');
    await orm.schema.execute('set foreign_key_checks = 1');
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
    expect(diff4.split('\n').filter(i => i).sort().join('\n')).toMatchSnapshot();
    await orm.schema.execute(diff4);
  });

});
