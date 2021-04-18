import { MikroORM, wrap } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { initORMMySql, wipeDatabaseMySql } from './bootstrap';
import { FooBar2, FooBaz2 } from './entities-sql';

describe('EntityHelperMySql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  beforeEach(async () => wipeDatabaseMySql(orm.em));

  test(`toObject allows to hide PK (GH issue 644)`, async () => {
    const bar = FooBar2.create('fb');
    await orm.em.persistAndFlush(bar);
    expect(wrap(bar).toObject(['id'])).not.toMatchObject({ id: bar.id, name: 'fb' });
  });

  test(`toObject handles recursion in 1:1`, async () => {
    const bar = FooBar2.create('fb');
    bar.baz = new FooBaz2('fz');
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const repo = orm.em.getRepository(FooBar2);
    const a = await repo.findOneOrFail(bar.id, ['baz.bar']);
    expect(wrap(a.baz).isInitialized()).toBe(true);
    expect(wrap(a.baz!.bar).isInitialized()).toBe(true);
    expect(wrap(a).toJSON()).toEqual({
      baz: {
        bar: {
          id: 1,
          name: 'fb',
          objectProperty: null,
          random: 123,
          version: a.version,
          array: null,
          blob: null,
          fooBar: null,
        }, // circular reference breaks the cycle
        id: 1,
        name: 'fz',
        version: a.baz!.version,
      },
      fooBar: null,
      id: 1,
      name: 'fb',
      random: 123,
      version: a.version,
      array: null,
      objectProperty: null,
      blob: null,
    });
  });

  afterAll(async () => orm.close(true));

});
