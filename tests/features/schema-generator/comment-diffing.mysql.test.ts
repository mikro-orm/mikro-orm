import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver, SchemaGenerator } from '@mikro-orm/postgresql';

@Entity({ tableName: 'book' })
export class Book0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity({ tableName: 'book', comment: 'this is books table' })
export class Book1 {

  @PrimaryKey({ comment: 'this is primary key' })
  id!: number;

  @Property({ comment: 'this is name of book' })
  name!: string;

}

@Entity({ tableName: 'book', comment: 'table comment' })
export class Book2 {

  @PrimaryKey({ comment: 'new comment' })
  id!: number;

  @Property({ comment: '' })
  name!: string;

}

@Entity({ tableName: 'book' })
export class Book3 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

describe('comment diffing in mysql', () => {

  let orm: MikroORM<PostgreSqlDriver>;
  let generator: SchemaGenerator;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book0],
      dbName: `mikro_orm_test_comments`,
      type: 'mysql',
      port: 3307,
    });
    generator = orm.getSchemaGenerator();
    await generator.ensureDatabase();
    await generator.execute('drop table if exists book');
    await generator.createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema generator updates comments', async () => {
    await orm.discoverEntity(Book1);
    orm.getMetadata().reset('Book0');
    const diff1 = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await generator.execute(diff1);

    orm.getMetadata().reset('Book1');
    await orm.discoverEntity(Book2);
    const diff2 = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await generator.execute(diff2);

    orm.getMetadata().reset('Book2');
    await orm.discoverEntity(Book3);
    const diff3 = await generator.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toMatchSnapshot();
    await generator.execute(diff3);

    await expect(generator.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

});
