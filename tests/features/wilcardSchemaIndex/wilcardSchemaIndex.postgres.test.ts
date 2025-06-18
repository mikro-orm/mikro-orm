import { Entity, Index, MikroORM, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

let orm: MikroORM;
const dbName = `db-${v4()}`; // random db name
const schema1 = `library1`;
const schema2 = `library2`;

@Entity({ tableName: 'author', schema: '*' })
@Index({ name: 'custom_idx_on_name', expression: (table, columns) => `create index custom_idx_on_name on "${table.schema}"."${table.name}" ("${columns.name}")` })
@Index({ name: 'custom_idx_on_country', expression: (table, columns, quote) => quote`create index ${'custom_idx_on_country'} on ${table} (${columns.country})` })
@Unique({ name: 'custom_unique_on_email', expression: (table, columns) => `alter table ${table} add constraint email_unique unique ("${columns.email}")` })
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Property()
  email: string;

  @Property()
  country: string;

  constructor(name: string, email: string, country: string) {
    this.name = name;
    this.email = email;
    this.country = country;
  }

}

describe('wilcardSchemaIndex', () => {

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Author],
      dbName,
      port: 5432,
      driver: PostgreSqlDriver,
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
