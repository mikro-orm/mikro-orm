import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import type { MySqlDriver } from '@mikro-orm/mysql';

@Entity({ tableName: 'book' })
export class Book1 {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp` })
  createdAt!: Date;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp`, extra: `on update current_timestamp` })
  updatedAt!: Date;

}

@Entity({ tableName: 'book' })
export class Book2 {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp` })
  createdAt!: Date;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp` })
  updatedAt!: Date;

}

@Entity({ tableName: 'book' })
export class Book3 {

  @PrimaryKey()
  id!: number;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp` })
  createdAt!: Date;

  @Property({ columnType: 'timestamp', defaultRaw: `current_timestamp`, extra: `on update current_timestamp` })
  updatedAt!: Date;

}

describe('changing column in mysql (GH 2386)', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Book1],
      dbName: `mikro_orm_test_gh_2386`,
      type: 'mysql',
      port: 3307,
    });
    await orm.getSchemaGenerator().ensureDatabase();
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('schema generator respect indexes on FKs on column update', async () => {
    const diff0 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff0).toBe('');
    await orm.discoverEntity(Book2);
    orm.getMetadata().reset('Book1');
    const diff1 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff1).toBe('alter table `book` modify `updated_at` timestamp not null default current_timestamp;\n\n');
    await orm.getSchemaGenerator().execute(diff1);

    await orm.discoverEntity(Book3);
    orm.getMetadata().reset('Book2');
    const diff3 = await orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false });
    expect(diff3).toBe('alter table `book` modify `updated_at` timestamp not null default current_timestamp on update current_timestamp;\n\n');
    await orm.getSchemaGenerator().execute(diff3);
  });

});
