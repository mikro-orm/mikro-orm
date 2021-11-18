import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'book' })
export class Book1 {

  @PrimaryKey()
  id!: number;

  @Property({ default: true, nullable: true, comment: 'this is a comment' })
  myColumn: boolean = true;

}

@Entity({ tableName: 'book' })
export class Book2 {

  @PrimaryKey()
  id!: number;

  @Property({ default: false, nullable: false, comment: 'this is a comment' })
  myColumn: boolean = false;

}

@Entity({ tableName: 'book' })
export class Book3 {

  @PrimaryKey()
  id!: number;

  @Property({ default: false, nullable: true })
  myColumn: boolean = false;

}

@Entity({ tableName: 'book' })
export class Book4 {

  @PrimaryKey()
  id!: number;

  @Property({ default: false, nullable: true, comment: 'lalala' })
  myColumn: boolean = false;

}

@Entity({ tableName: 'book' })
export class Book5 {

  @PrimaryKey()
  id!: number;

  @Property({ default: false, nullable: true, comment: 'lololo' })
  myColumn: boolean = false;

}

describe('changing column in postgres (GH 2407)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book1],
      dbName: `mikro_orm_test_gh_2407`,
      type: 'postgresql',
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema generator respect indexes on FKs on column update', async () => {
    await orm.discoverEntity(Book2);
    orm.getMetadata().reset('Book1');
    const diff1 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe(`alter table "book" drop constraint if exists "book_my_column_check";
alter table "book" alter column "my_column" type boolean using ("my_column"::boolean);
alter table "book" alter column "my_column" set default false;
alter table "book" alter column "my_column" set not null;\n\n`);
    await orm.getSchemaGenerator().execute(diff1);

    await orm.discoverEntity(Book3);
    orm.getMetadata().reset('Book2');
    const diff3 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toBe(`alter table "book" drop constraint if exists "book_my_column_check";
alter table "book" alter column "my_column" type boolean using ("my_column"::boolean);
alter table "book" alter column "my_column" drop not null;\n\n`);
    await orm.getSchemaGenerator().execute(diff3);

    await orm.discoverEntity(Book4);
    orm.getMetadata().reset('Book3');
    const diff4 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff4).toBe(`comment on column "book"."my_column" is 'lalala';\n\n`);
    await orm.getSchemaGenerator().execute(diff4);

    await orm.discoverEntity(Book5);
    orm.getMetadata().reset('Book4');
    const diff5 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff5).toBe(`comment on column "book"."my_column" is 'lololo';\n\n`);
    await orm.getSchemaGenerator().execute(diff5);
  });

});
