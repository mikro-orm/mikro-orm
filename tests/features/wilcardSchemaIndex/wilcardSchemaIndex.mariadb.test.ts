import { Entity, Index, MikroORM, PrimaryKey, Property, Unique, quote, raw } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { MariaDbDriver } from '@mikro-orm/mariadb';

let orm: MikroORM;
const dbName = `db-${v4()}`; // random db name
const schema1 = `library1`;
const schema2 = `library2`;

@Entity({ tableName: 'author', schema: '*' })
@Index({ name: 'custom_idx_on_name', expression: (table, columns) => `create index custom_idx_on_name on \`${table.schema}\`.\`${table.name}\` (\`${columns.name}\`)` })
@Index({ name: 'custom_idx_on_country', expression: (table, columns) => quote`create index ${'custom_idx_on_country'} on ${table} (${columns.country})` })
@Unique({ name: 'custom_unique_on_email', expression: (table, columns) => raw(`alter table ?? add constraint ?? unique (??)`, [table, 'custom_unique_on_email', columns.email]) })
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
@Index({ name: 'custom_idx_on_name', expression: (table, columns) => `create index custom_idx_on_name on \`${table}\` (\`${columns.name}\`)` })
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
      entities: [Author, Author2],
      dbName,
      port: 3309,
      driver: MariaDbDriver,
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
