import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity({ tableName: 'book' })
export class Book0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

}

@Entity({ tableName: 'book', comment: 'this is book\'s table' })
export class Book1 {

  @PrimaryKey({ comment: 'this is primary\'s key' })
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

let orm: MikroORM<PostgreSqlDriver>;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Book0],
    schema: 'foo',
    dbName: `mikro_orm_test_comments`,
    driver: PostgreSqlDriver,
  });
  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('comment diffing in postgres', async () => {
  orm.getMetadata().reset('Book0');
  await orm.discoverEntity(Book1);
  const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff1).toMatchSnapshot();
  await orm.schema.execute(diff1);

  await orm.discoverEntity(Book2);
  orm.getMetadata().reset('Book1');
  const diff2 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff2).toMatchSnapshot();
  await orm.schema.execute(diff2);

  await orm.discoverEntity(Book3);
  orm.getMetadata().reset('Book2');
  const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff3).toMatchSnapshot();
  await orm.schema.execute(diff3);

  await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
});
