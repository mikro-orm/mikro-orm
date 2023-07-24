import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

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
      driver: PostgreSqlDriver,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('schema generator respect indexes on FKs on column update', async () => {
    orm.getMetadata().reset('Book1');
    await orm.discoverEntity(Book2);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe(`alter table "book" alter column "my_column" type boolean using ("my_column"::boolean);
alter table "book" alter column "my_column" set default false;
alter table "book" alter column "my_column" set not null;\n\n`);
    await orm.schema.execute(diff1);

    orm.getMetadata().reset('Book2');
    await orm.discoverEntity(Book3);
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toBe(`alter table "book" alter column "my_column" type boolean using ("my_column"::boolean);
alter table "book" alter column "my_column" drop not null;\n\n`);
    await orm.schema.execute(diff3);

    orm.getMetadata().reset('Book3');
    await orm.discoverEntity(Book4);
    const diff4 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff4).toBe(`comment on column "book"."my_column" is 'lalala';\n\n`);
    await orm.schema.execute(diff4);

    orm.getMetadata().reset('Book4');
    await orm.discoverEntity(Book5);
    const diff5 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff5).toBe(`comment on column "book"."my_column" is 'lololo';\n\n`);
    await orm.schema.execute(diff5);
  });

});
