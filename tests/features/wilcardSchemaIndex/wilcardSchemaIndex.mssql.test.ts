import { Entity, Index, MikroORM, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { MsSqlDriver } from '@mikro-orm/mssql';

let orm: MikroORM;
const dbName = `db-${v4()}`; // random db name
const schema1 = `library1`;
const schema2 = `library2`;

@Entity({ tableName: 'author', schema: '*' })
@Index({ name: 'custom_idx_on_name', expression: (table, columns) => `create index custom_idx_on_name on [${table.schema}].[${table.name}] ([${columns.name}])` })
@Unique({ name: 'custom_unique_on_email', expression: (table, columns) => `create unique index custom_unique_on_email on ${table.quoted} ([${columns.email}]) where [${columns.email}] IS NOT NULL` })
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

describe('wilcardSchemaIndex', () => {

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author],
      dbName,
      port: 1433,
      password: 'Root.Root',
      driver: MsSqlDriver,
    });
  });

  afterAll(async () => {
    if (orm) {
      await orm.schema.dropDatabase();
      await orm.close(true);
    }
  });

  test('create SQL schema', async () => {

    let createDump = await orm.schema.getCreateSchemaSQL({ schema: schema1 });
    expect(createDump).toMatchSnapshot('createSchemaSQL-dump');

    createDump = await orm.schema.getCreateSchemaSQL({ schema: schema2 });
    expect(createDump).toMatchSnapshot('createSchemaSQL-dump');

  });

});
