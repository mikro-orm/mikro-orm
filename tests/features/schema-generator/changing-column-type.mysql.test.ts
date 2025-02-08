import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mysql';

@Entity({ tableName: 'book' })
class Book1 {

  @PrimaryKey()
  id!: number;

  @Property({ default: 1, nullable: true, comment: 'this is a comment' })
  myColumn: boolean = true;

  @Property({ columnType: `SET('one','two')` })
  mySetCol!: string;

}

@Entity({ tableName: 'book' })
class Book2 {

  @PrimaryKey()
  id!: number;

  @Property({ default: 1, nullable: false, comment: 'this is a comment' })
  myColumn: boolean = true;

  @Property({ columnType: `SET('one','two')` })
  mySetCol!: string;

}

@Entity({ tableName: 'book' })
class Book3 {

  @PrimaryKey()
  id!: number;

  @Property({ default: 123, nullable: true })
  myColumn: boolean = true;

  @Property({ columnType: `SET('one','two')` })
  mySetCol!: string;

}

@Entity({ tableName: 'book' })
class Book4 {

  @PrimaryKey()
  id!: number;

  @Property({ default: 123, nullable: true, comment: 'lalala' })
  myColumn: boolean = true;

  @Property({ columnType: `SET('one','two')` })
  mySetCol!: string;

}

@Entity({ tableName: 'book' })
class Book5 {

  @PrimaryKey()
  id!: number;

  @Property({ default: 123, nullable: true, comment: 'lololo' })
  myColumn: boolean = true;

  @Property({ columnType: `SET('one','two')` })
  mySetCol!: string;

}

describe('changing column in mysql (GH 2407)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book1],
      dbName: `mikro_orm_test_gh_2407`,
      port: 3308,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('schema generator respect indexes on FKs on column update', async () => {
    orm.discoverEntity(Book2, 'Book1');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe('alter table `book` modify `my_column` tinyint(1) not null default 1 comment \'this is a comment\';\n');
    await orm.schema.execute(diff1);

    orm.discoverEntity(Book3, 'Book2');
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toBe('alter table `book` modify `my_column` tinyint(1) null default 123;\n');
    await orm.schema.execute(diff3);

    orm.discoverEntity(Book4, 'Book3');
    const diff4 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff4).toBe('alter table `book` modify `my_column` tinyint(1) null default 123 comment \'lalala\';\n');
    await orm.schema.execute(diff4);

    orm.discoverEntity(Book5, 'Book4');
    const diff5 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff5).toBe('alter table `book` modify `my_column` tinyint(1) null default 123 comment \'lololo\';\n');
    await orm.schema.execute(diff5);
  });

});
