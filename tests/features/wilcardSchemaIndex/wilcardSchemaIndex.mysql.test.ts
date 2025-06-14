import { Entity, Index, MikroORM, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { MySqlDriver } from '@mikro-orm/mysql';

let orm: MikroORM;
const dbName = `db-${v4()}`; // random db name
const schema1 = `library1`;
const schema2 = `library2`;

@Entity({ tableName: 'author', schema: '*' })
@Index({ name: 'custom_idx_on_name', expression: (table, columns) => `create index custom_idx_on_name on \`${table.schema}\`.\`${table.name}\` (\`${columns.name}\`)` })
@Unique({ name: 'custom_unique_on_email', expression: (table, columns) => `alter table ${table} add constraint email_unique unique (\`${columns.email}\`)` })
export class Author2 {

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
      entities: [Author2],
      dbName,
      port: 3308,
      driver: MySqlDriver,
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
