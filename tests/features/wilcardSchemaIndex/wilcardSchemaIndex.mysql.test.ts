import { MikroORM, quote, raw } from '@mikro-orm/core';
import { Entity, Index, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { MySqlDriver } from '@mikro-orm/mysql';

let orm: MikroORM;
const dbName = `db-${v4()}`; // random db name
const schema1 = `library1`;
const schema2 = `library2`;

@Entity({ tableName: 'author', schema: '*' })
@Index({
  name: 'custom_idx_on_name',
  expression: (columns, table, name) =>
    `create index ${name} on \`${table.schema}\`.\`${table.name}\` (\`${columns.name}\`)`,
})
@Index({
  name: 'custom_idx_on_country',
  expression: (columns, table, name) => quote`create index ${name} on ${table} (${columns.country})`,
})
@Unique({
  name: 'custom_unique_on_email',
  expression: (columns, table, name) =>
    raw(`alter table ?? add constraint ?? unique (??)`, [table, name, columns.email]),
})
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

@Entity({ tableName: 'author2' })
@Index({
  name: 'custom_idx_on_name',
  expression: (columns, table) => `create index custom_idx_on_name on \`${table}\` (\`${columns.name}\`)`,
})
export class Author2 {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

describe('wilcardSchemaIndex', () => {
  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Author, Author2],
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

    createDump = await orm.schema.getCreateSchemaSQL();
    expect(createDump).toMatchSnapshot('createSchemaSQL-dump');
  });
});
