import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';

@Entity({ tableName: 'book' })
class Book1 {

  @PrimaryKey()
  id!: number;

  @Property({ default: true, nullable: true, comment: 'this is a comment' })
  myColumn: boolean = true;

  @Property({ type: 'character varying' })
  myStrCol: string = '';

  @Property({ columnType: 'integer[3][3]' })
  sudokuSquare!: number[][];

}

@Entity({ tableName: 'book' })
class Book2 {

  @PrimaryKey()
  id!: number;

  @Property({ default: false, nullable: false, comment: 'this is a comment' })
  myColumn: boolean = false;

  @Property({ type: 'character varying', columnType: 'character varying' })
  myStrCol: string = '';

  @Property({ columnType: 'integer[3][3]' })
  sudokuSquare!: number[][];

}

@Entity({ tableName: 'book' })
class Book3 {

  @PrimaryKey()
  id!: number;

  @Property({ default: false, nullable: true })
  myColumn: boolean = false;

  @Property({ type: 'character varying', columnType: 'character varying' })
  myStrCol: string = '';

}

@Entity({ tableName: 'book' })
class Book4 {

  @PrimaryKey()
  id!: number;

  @Property({ default: false, nullable: true, comment: 'lalala' })
  myColumn: boolean = false;

}

@Entity({ tableName: 'book' })
class Book5 {

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
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('schema generator respect indexes on FKs on column update', async () => {
    orm.discoverEntity(Book2, 'Book1');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe(`alter table "book" alter column "my_column" set default false;
alter table "book" alter column "my_column" set not null;
alter table "book" alter column "my_str_col" type character varying using ("my_str_col"::character varying);
alter table "book" alter column "sudoku_square" type integer[3][3] using ("sudoku_square"::integer[3][3]);
`);
    await orm.schema.execute(diff1);

    orm.discoverEntity(Book3, 'Book2');
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toBe(`alter table "book" drop column "sudoku_square";
alter table "book" alter column "my_column" drop not null;
alter table "book" alter column "my_str_col" type character varying using ("my_str_col"::character varying);
`);
    await orm.schema.execute(diff3);

    orm.discoverEntity(Book4, 'Book3');
    const diff4 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff4).toBe(`alter table "book" drop column "my_str_col";
comment on column "book"."my_column" is 'lalala';\n`);
    await orm.schema.execute(diff4);

    orm.discoverEntity(Book5, 'Book4');
    const diff5 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff5).toBe(`comment on column "book"."my_column" is 'lololo';\n`);
    await orm.schema.execute(diff5);
  });

});
