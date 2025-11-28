import { MikroORM, t, Opt, Utils, AbstractSqlDriver } from '@mikro-orm/knex';
import { Embeddable, Embedded, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { PLATFORMS } from '../bootstrap.js';

enum EnumItems {
  A = 'a',
  B = 'b',
  C = 'c',
}

@Embeddable()
class Account {

  @Property()
  type!: string;

}

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property({ type: t.array, nullable: false, default: ['en'] })
  languages: Opt<string[]> = ['en'];

  @Embedded(() => Account, { array: true, default: [] })
  accounts: Opt<Account[]> = [];

  @Enum({ items: () => EnumItems, array: true, default: [] })
  items: Opt<EnumItems[]> = [];

}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'default_array_values', port: 3308 },
  mariadb: { dbName: 'default_array_values', port: 3309 },
  postgresql: { dbName: 'default_array_values' },
  mssql: { dbName: 'default_array_values', password: 'Root.Root' },
};

describe.each(Utils.keys(options))('default array values [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [A],
      driver: PLATFORMS[type],
      ...options[type],
    });

    await orm.schema.ensureDatabase();
  });

  afterAll(() => orm.close(true));

  afterEach(() => orm.schema.dropSchema());

  test('database default when using arrays', async () => {
    const sql = await orm.schema.getCreateSchemaSQL();
    expect(sql).toMatchSnapshot();
    await orm.schema.execute(sql);
  });
});
