import { Entity, PrimaryKey, Property, MikroORM } from '@mikro-orm/mysql';

@Entity({ tableName: 'book' })
class Book1 {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp` })
  createdAt!: Date;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp`, extra: `on update current_timestamp` })
  updatedAt!: Date;

}

@Entity({ tableName: 'book' })
class Book2 {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp` })
  createdAt!: Date;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp` })
  updatedAt!: Date;

}

@Entity({ tableName: 'book' })
class Book3 {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp` })
  createdAt!: Date;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp`, extra: `on update current_timestamp` })
  updatedAt!: Date;

}

describe('changing column in mysql (GH 2386)', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book1],
      dbName: `mikro_orm_test_gh_2386`,
      port: 3308,
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(() => orm.close(true));

  test('schema generator respect indexes on FKs on column update', async () => {
    const diff0 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff0).toBe('');
    orm.discoverEntity(Book2, 'Book1');
    const diff1 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe('alter table `book` modify `updated_at` timestamp not null default current_timestamp;\n');
    await orm.schema.execute(diff1);

    orm.discoverEntity(Book3, 'Book2');
    const diff3 = await orm.schema.getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toBe('alter table `book` modify `updated_at` timestamp not null default current_timestamp on update current_timestamp;\n');
    await orm.schema.execute(diff3);
  });

});
