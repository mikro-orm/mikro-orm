import { Entity, PrimaryKey, Property, t } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';

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

  @Property({ length: 2 })
  createdAt!: Date;

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

  @Property({ length: 3 })
  createdAt!: Date;

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

  @Property({ length: 3 })
  createdAt!: Date;

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

  @Property({ length: 3 })
  createdAt!: Date;

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

  @Property({ length: 3 })
  createdAt!: Date;

}

describe('length diffing in postgres', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book0],
      dbName: `mikro_orm_test_length_diffing`,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists book');
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema orm.schema updates column types when length changes (varchar, decimal, ...)', async () => {
    orm.getMetadata().reset('Book0');
    await orm.discoverEntity(Book1);
    const diff1 = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1.up);

    orm.getMetadata().reset('Book1');
    await orm.discoverEntity(Book2);
    const diff2 = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2.up);

    orm.getMetadata().reset('Book2');
    await orm.discoverEntity(Book3);
    const diff3 = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff3).toMatchSnapshot();
    await orm.schema.execute(diff3.up);

    orm.getMetadata().reset('Book3');
    await orm.discoverEntity(Book4);

    await expect(orm.schema.getUpdateSchemaMigrationSQL({ wrap: false })).resolves.toEqual({
      down: '',
      up: '',
    });
  });

});
