import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';
import { initORMMsSql } from '../bootstrap';

@Entity()
class Test {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'string', length: 255 })
  path?: string;

}

describe('MsSqlPlatform', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMMsSql({
      entities: [Test],
    });
  });

  afterAll(() => orm.close(true));

  test(`unicode characters escaping`, async () => {
    const test = new Test();
    test.path = '\\\\path\\to\\directory';

    orm.em.persist(test);

    orm.config.set('colors', false);
    const mock = mockLogger(orm, ['query', 'query-params']);

    await orm.em.flush();

    expect(mock.mock.calls[0][0]).toMatch('[query] begin');
    expect(mock.mock.calls[1][0]).toMatch(`[query] insert into [test] ([path]) output inserted.[id] values (N'\\\\path\\to\\directory')`);
    expect(mock.mock.calls[2][0]).toMatch('[query] commit');
  });
});
