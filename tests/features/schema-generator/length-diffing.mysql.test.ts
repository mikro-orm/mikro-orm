import { Entity, MikroORM, PrimaryKey, Property, t } from '@mikro-orm/core';
import type { PostgreSqlDriver, SchemaGenerator } from '@mikro-orm/postgresql';
import { MySqlDriver } from '@mikro-orm/mysql';

@Entity({ tableName: 'book' })
export class Book0 {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  length!: number;

  @Property({ type: t.decimal })
  price!: string;

}

@Entity({ tableName: 'book' })
export class Book1 {

  @PrimaryKey({ type: t.bigint })
  id!: string;

  @Property({ length: 100 })
  name!: string;

  @Property({ unsigned: true })
  length!: number;

  @Property({ type: t.decimal, precision: 16 })
  price!: string;

}

@Entity({ tableName: 'book' })
export class Book2 {

  @PrimaryKey({ type: t.bigint })
  id!: string;

  @Property({ length: 150 })
  name!: string;

  @Property({ unsigned: true })
  length!: number;

  @Property({ type: t.decimal, precision: 16, scale: 4 })
  price!: number;

}

@Entity({ tableName: 'book' })
export class Book3 {

  @PrimaryKey({ type: t.bigint })
  id!: string;

  @Property({ length: 100 })
  name!: string;

  @Property({ unsigned: true })
  length!: number;

  @Property({ columnType: 'decimal(16,4)' })
  price!: number;

}

@Entity({ tableName: 'book' })
export class Book4 {

  @PrimaryKey({ type: t.bigint })
  id!: string;

  @Property({ columnType: 'varchar(100)' })
  name!: string;

  @Property({ unsigned: true })
  length!: number;

  @Property({ columnType: 'decimal(16,4)' })
  price!: number;

}

describe('length diffing in mysql', () => {

  let orm: MikroORM<MySqlDriver>;
  let generator: SchemaGenerator;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book0],
      dbName: `mikro_orm_test_length_diffing`,
      driver: MySqlDriver,
      port: 3308,
    });
    generator = orm.schema;
    await generator.ensureDatabase();
    await generator.execute('drop table if exists book');
    await generator.createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema generator updates column types when length changes (varchar, decimal, ...)', async () => {
    orm.getMetadata().reset('Book0');
    await orm.discoverEntity(Book1);
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

    orm.getMetadata().reset('Book3');
    await orm.discoverEntity(Book4);

    await expect(generator.getUpdateSchemaSQL({ wrap: false })).resolves.toBe('');
  });

});
