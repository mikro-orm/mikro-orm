import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mysql';

@Entity({ tableName: 'book' })
class Book1 {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'int' })
  changingField!: number;

  @Property({ lazy: true, type: 'tinyblob', nullable: true })
  blob3?: Buffer;

  @Property({ lazy: true, type: 'mediumblob', nullable: true })
  blob4?: Buffer;

  @Property({ lazy: true, type: 'longblob', nullable: true })
  blob5?: Buffer;

}

@Entity({ tableName: 'book' })
class Book2 {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp', ignoreSchemaChanges: ['type'] })
  changingField!: Date;

  @Property({ lazy: true, type: 'tinyblob', nullable: true })
  blob3?: Buffer;

  @Property({ lazy: true, type: 'mediumblob', nullable: true })
  blob4?: Buffer;

  @Property({ lazy: true, type: 'longblob', nullable: true })
  blob5?: Buffer;

}

@Entity({ tableName: 'book' })
class Book3 {

  @PrimaryKey()
  id!: number;

  @Property({
    columnType: 'int',
    extra: 'VIRTUAL GENERATED',
    ignoreSchemaChanges: ['extra'],
  })
  changingField!: number;

  @Property({ lazy: true, type: 'tinyblob', nullable: true })
  blob3?: Buffer;

  @Property({ lazy: true, type: 'mediumblob', nullable: true })
  blob4?: Buffer;

  @Property({ lazy: true, type: 'longblob', nullable: true })
  blob5?: Buffer;

}

@Entity({ tableName: 'book' })
class Book4 {

  @PrimaryKey()
  id!: number;

  @Property({
    columnType: 'timestamp',
    extra: 'VIRTUAL GENERATED',
    ignoreSchemaChanges: ['extra', 'type'],
  })
  changingField!: Date;

  @Property({ lazy: true, type: 'tinyblob', nullable: true })
  blob3?: Buffer;

  @Property({ lazy: true, type: 'mediumblob', nullable: true })
  blob4?: Buffer;

  @Property({ lazy: true, type: 'longblob', nullable: true })
  blob5?: Buffer;

}

@Entity({ tableName: 'book' })
class Book5 {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp' })
  changingField!: Date;

  @Property({ lazy: true, type: 'tinyblob', nullable: true })
  blob3?: Buffer;

  @Property({ lazy: true, type: 'mediumblob', nullable: true })
  blob4?: Buffer;

  @Property({ lazy: true, type: 'longblob', nullable: true })
  blob5?: Buffer;

}

describe('ignore specific schema changes (GH 1904)', () => {
  let orm: MikroORM;

  beforeEach(async () => {
    orm = await MikroORM.init({
      entities: [Book1],
      dbName: `mikro_orm_test_gh_1904`,
      port: 3308,
    });
    await orm.schema.refreshDatabase();
  });

  afterEach(() => orm.close(true));

  test('create schema with various blobs', async () => {
    const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
    expect(sql.trim()).toBe('create table `book` (`id` int unsigned not null auto_increment primary key, `changing_field` int not null, `blob3` tinyblob null, `blob4` mediumblob null, `blob5` longblob null) default character set utf8mb4 engine = InnoDB;');
  });

  test('schema generator respects ignoreSchemaChanges for `type`', async () => {
    const diff0 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff0).toBe('');
    orm.discoverEntity(Book2, 'Book1');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe('');

    // Once we remove ignoreSchemaChanges, we should see a diff again.
    orm.discoverEntity(Book5, 'Book2');
    const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toBe('alter table `book` modify `changing_field` timestamp not null;\n');
  });

  test('schema generator respects ignoreSchemaChanges for `extra`', async () => {
    const diff0 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff0).toBe('');
    orm.discoverEntity(Book3, 'Book1');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe('');
  });

  test('schema generator respects ignoreSchemaChanges for `extra` and `type`', async () => {
    const diff0 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff0).toBe('');
    orm.discoverEntity(Book4, 'Book1');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe('');
  });
});
