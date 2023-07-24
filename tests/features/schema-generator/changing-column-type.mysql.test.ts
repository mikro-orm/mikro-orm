import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';

@Entity({ tableName: 'book' })
export class Book1 {

  @PrimaryKey()
  id!: number;

  @Property({ default: 1, nullable: true, comment: 'this is a comment' })
  myColumn: boolean = true;

}

@Entity({ tableName: 'book' })
export class Book2 {

  @PrimaryKey()
  id!: number;

  @Property({ default: 1, nullable: false, comment: 'this is a comment' })
  myColumn: boolean = true;

}

@Entity({ tableName: 'book' })
export class Book3 {

  @PrimaryKey()
  id!: number;

  @Property({ default: 123, nullable: true })
  myColumn: boolean = true;

}

@Entity({ tableName: 'book' })
export class Book4 {

  @PrimaryKey()
  id!: number;

  @Property({ default: 123, nullable: true, comment: 'lalala' })
  myColumn: boolean = true;

}

@Entity({ tableName: 'book' })
export class Book5 {

  @PrimaryKey()
  id!: number;

  @Property({ default: 123, nullable: true, comment: 'lololo' })
  myColumn: boolean = true;

}

describe('changing column in mysql (GH 2407)', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book1],
      dbName: `mikro_orm_test_gh_2407`,
      driver: MySqlDriver,
      port: 3308,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('schema generator respect indexes on FKs on column update', async () => {
    orm.getMetadata().reset('Book1');
    await orm.discoverEntity(Book2);
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe('alter table `book` modify `my_column` tinyint(1) not null default 1 comment \'this is a comment\';\n\n');
    await orm.schema.execute(diff1);

    orm.getMetadata().reset('Book2');
    await orm.discoverEntity(Book3);
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toBe('alter table `book` modify `my_column` tinyint(1) null default 123;\n\n');
    await orm.schema.execute(diff3);

    orm.getMetadata().reset('Book3');
    await orm.discoverEntity(Book4);
    const diff4 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff4).toBe('alter table `book` modify `my_column` tinyint(1) null default 123 comment \'lalala\';\n\n');
    await orm.schema.execute(diff4);

    orm.getMetadata().reset('Book4');
    await orm.discoverEntity(Book5);
    const diff5 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff5).toBe('alter table `book` modify `my_column` tinyint(1) null default 123 comment \'lololo\';\n\n');
    await orm.schema.execute(diff5);
  });

});
