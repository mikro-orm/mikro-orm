import { Entity, IDatabaseDriver, PrimaryKey, Property, SimpleLogger, Utils } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/core';
import { mockLogger } from '../helpers.js';
import { PLATFORMS } from '../bootstrap.js';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property({ length: 255 })
  unicode?: string;

  @Property({ columnType: 'varchar(255)' })
  nonUnicode?: string;

}

const options = {
  sqlite: { dbName: ':memory:' },
  libsql: { dbName: ':memory:' },
  mysql: { port: 3308 },
  mariadb: { port: 3309 },
  mssql: { password: 'Root.Root' },
  postgresql: {},
};

describe.each(Utils.keys(options))('String escape [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [Test],
      driver: PLATFORMS[type],
      dbName: 'string-escaping',
      loggerFactory: SimpleLogger.create,
      ...options[type],
    });

    await orm.schema.refreshDatabase();
  });

  beforeEach(() => orm.schema.clearDatabase());

  afterAll(() => orm.close(true));

  test(`strings escaping`, async () => {
    // Shouldn't be escaped.
    const test = new Test();
    test.unicode = '\\\\path\\to\\directory';
    test.nonUnicode = '\\\\path\\to\\directory';

    // Should be escaped.
    const test2 = new Test();
    test2.unicode = `It's sunny today`;
    test2.nonUnicode = `It's raining today`;

    // Should be escaped twice.
    const test3 = new Test();
    test3.unicode = `It's 'quoted'`;
    test3.nonUnicode = `It's 'quoted'`;

    orm.em.persist(test);
    orm.em.persist(test2);
    orm.em.persist(test3);

    const mock = mockLogger(orm, ['query', 'query-params']);

    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('[query] begin');

    switch (type) {
      case 'sqlite':
      case 'libsql':
        expect(mock.mock.calls[1][0]).toMatch("insert into `test` (`unicode`, `non_unicode`) values ('\\\\path\\to\\directory', '\\\\path\\to\\directory'), ('It''s sunny today', 'It''s raining today'), ('It''s ''quoted''', 'It''s ''quoted''') returning `id`");
       break;
      case 'mysql':
      case 'mariadb':
        expect(mock.mock.calls[1][0]).toMatch("insert into `test` (`unicode`, `non_unicode`) values ('\\\\\\\\path\\\\to\\\\directory', '\\\\\\\\path\\\\to\\\\directory'), ('It\\'s sunny today', 'It\\'s raining today'), ('It\\'s \\'quoted\\'', 'It\\'s \\'quoted\\'')");
        break;
      case 'mssql':
        expect(mock.mock.calls[1][0]).toMatch("insert into [test] ([unicode], [non_unicode]) output inserted.[id] values (N'\\\\path\\to\\directory', '\\\\path\\to\\directory'), (N'It''s sunny today', 'It''s raining today'), (N'It''s ''quoted''', 'It''s ''quoted''')");
        break;
      case 'postgresql':
        expect(mock.mock.calls[1][0]).toMatch(`insert into "test" ("unicode", "non_unicode") values ( E'\\\\\\\\path\\\\to\\\\directory', E'\\\\\\\\path\\\\to\\\\directory'), ('It''s sunny today', 'It''s raining today'), ('It''s ''quoted''', 'It''s ''quoted''') returning "id"`);
        break;
    }

    expect(mock.mock.calls[2][0]).toMatch('commit');

    orm.em.clear();

    // Try to refetch entity.
    const test4 = await orm.em.findOneOrFail(Test, { unicode: '\\\\path\\to\\directory' });
    expect(test4.unicode).toEqual('\\\\path\\to\\directory');
  });
});
