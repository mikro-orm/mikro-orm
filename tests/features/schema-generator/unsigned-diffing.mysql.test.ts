import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mysql';

@Entity({ tableName: 'book' })
class Book0 {

  @PrimaryKey()
  id!: number;

  @Property()
  price1!: number;

  @Property({ type: 'decimal' })
  price2!: string;

  @Property({ type: 'double' })
  price3!: string;

}

@Entity({ tableName: 'book' })
class Book1 {

  @PrimaryKey()
  id!: number;

  @Property({ unsigned: true })
  price1!: number;

  @Property({ type: 'decimal', unsigned: true })
  price2!: string;

  @Property({ type: 'double', unsigned: true })
  price3!: string;

}

@Entity({ tableName: 'book' })
class Book2 {

  @PrimaryKey()
  id!: number;

  @Property()
  price1!: number;

  @Property({ type: 'decimal' })
  price2!: string;

  @Property({ type: 'double' })
  price3!: string;

}

describe('unsigned diffing in mysql', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book0],
      dbName: `mikro_orm_test_unsigned_diffing`,
      port: 3308,
    });
    await orm.schema.ensureDatabase();
    await orm.schema.execute('drop table if exists book');
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema generator updates column types when length changes (varchar, decimal, ...)', async () => {
    orm.discoverEntity(Book1, 'Book0');
    const diff1 = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff1).toMatchSnapshot();
    await orm.schema.execute(diff1.up);

    orm.discoverEntity(Book2, 'Book1');
    const diff2 = await orm.schema.getUpdateSchemaMigrationSQL({ wrap: false });
    expect(diff2).toMatchSnapshot();
    await orm.schema.execute(diff2.up);

    await expect(orm.schema.getUpdateSchemaMigrationSQL({ wrap: false })).resolves.toEqual({
      down: '',
      up: '',
    });
  });

});
