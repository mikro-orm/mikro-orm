import type { MikroORM } from '@mikro-orm/core';
import { wrap } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { initORMMySql } from './bootstrap.js';
import { FooBar2, FooBaz2 } from './entities-sql/index.js';

describe('EntityHelperMySql', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => orm = await initORMMySql('mysql', {}, true));
  beforeEach(async () => orm.schema.clearDatabase());
  afterAll(async () => {
    await orm.schema.dropDatabase();
    await orm.close(true);
  });

  test(`toObject allows to hide PK (GH issue 644)`, async () => {
    const bar = FooBar2.create('fb');
    await orm.em.persistAndFlush(bar);
    const dto = wrap(bar).toObject(['id']);
    expect(dto).not.toMatchObject({ id: bar.id, name: 'fb' });
    // @ts-expect-error
    expect(dto.id).toBeUndefined();
  });

  test(`toObject handles recursion in 1:1 (select-in)`, async () => {
    const bar = FooBar2.create('fb');
    bar.baz = new FooBaz2('fz');
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const repo = orm.em.getRepository(FooBar2);
    const a = await repo.findOneOrFail(bar.id, { populate: ['baz.bar'], strategy: 'select-in' });
    expect(wrap(a.baz!).isInitialized()).toBe(true);
    expect(wrap(a.baz!.bar!).isInitialized()).toBe(true);
    expect(wrap(a).toJSON()).toEqual({
      baz: {
        bar: {
          id: 1,
          name: 'fb',
          nameWithSpace: null,
          objectProperty: null,
          random: 123,
          version: a.version,
          array: null,
          blob: null,
          blob2: null,
          fooBar: null,
        }, // circular reference breaks the cycle
        id: 1,
        name: 'fz',
        code: 'fz',
        version: a.baz!.version,
      },
      fooBar: null,
      id: 1,
      name: 'fb',
      nameWithSpace: null,
      random: 123,
      version: a.version,
      array: null,
      objectProperty: null,
      blob: null,
      blob2: null,
    });
  });

  test(`toObject handles recursion in 1:1 (joined)`, async () => {
    const bar = FooBar2.create('fb');
    bar.baz = new FooBaz2('fz');
    await orm.em.persistAndFlush(bar);
    orm.em.clear();

    const repo = orm.em.getRepository(FooBar2);
    const a = await repo.findOneOrFail(bar.id, { populate: ['baz.bar'], strategy: 'joined' });
    expect(wrap(a.baz!).isInitialized()).toBe(true);
    expect(wrap(a.baz!.bar!).isInitialized()).toBe(true);
    expect(wrap(a).toJSON()).toEqual({
      baz: {
        bar: {
          id: 1,
          name: 'fb',
          nameWithSpace: null,
          objectProperty: null,
          random: 123,
          version: a.version,
          array: null,
          blob: null,
          blob2: null,
          fooBar: null,
        }, // circular reference breaks the cycle
        id: 1,
        name: 'fz',
        code: 'fz',
        version: a.baz!.version,
      },
      fooBar: null,
      id: 1,
      name: 'fb',
      nameWithSpace: null,
      random: 123,
      version: a.version,
      array: null,
      objectProperty: null,
      blob: null,
      blob2: null,
    });
  });

});
