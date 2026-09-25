import { defineEntity, LoadStrategy, p, PrimaryKeyProp, Utils } from '@mikro-orm/core';
import { type AbstractSqlDriver, MikroORM } from '@mikro-orm/sql';
import { PLATFORMS } from '../bootstrap.js';
import { mockLogger } from '../helpers.js';

const Item = defineEntity({
  name: 'SelectionDialectItem',
  properties: {
    id: p.integer().primary(),
    tenant: p.integer(),
    name: p.string(),
    reviews: () => p.oneToMany(Review).mappedBy('item'),
  },
});

const Review = defineEntity({
  name: 'SelectionDialectReview',
  properties: { id: p.integer().primary(), item: () => p.manyToOne(Item), body: p.string() },
});

class CompositeItem {
  tenant!: number;
  code!: string;
  [PrimaryKeyProp]?: ['tenant', 'code'];
}

const CompositeItemSchema = defineEntity({
  class: CompositeItem,
  properties: { tenant: p.integer().primary(), code: p.string().primary().fieldName('__selection_bucket') },
});

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { port: 3308 },
  mariadb: { port: 3309 },
  postgresql: {},
  mssql: { password: 'Root.Root' },
  oracledb: { password: 'oracle123', schemaGenerator: { managementDbName: 'system', tableSpace: 'mikro_orm' } },
};

describe.each(Utils.keys(options))('selection pagination [%s]', type => {
  let orm: MikroORM<AbstractSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init<AbstractSqlDriver>({
      entities: [Item, Review, CompositeItemSchema],
      driver: PLATFORMS[type],
      dbName: 'mikro_orm_test_selection',
      ...options[type],
    });
    await orm.schema.refresh();
    for (let id = 1; id <= 5; id++) {
      orm.em.create(Item, { id, tenant: id === 5 ? 2 : 1, name: `Item ${id}` });
      orm.em.create(CompositeItem, { tenant: id === 5 ? 2 : 1, code: `c${id}` });
    }
    orm.em.create(Review, { id: 1, item: 1, body: 'match' });
    orm.em.create(Review, { id: 2, item: 1, body: 'match' });
    orm.em.create(Review, { id: 3, item: 2, body: 'match' });
    orm.em.create(Review, { id: 4, item: 2, body: 'other' });
    await orm.em.flush();
    orm.em.clear();
  });

  afterAll(async () => orm?.close(true));

  test('paginates distinct entity keys and hydrates selected entities and full collections in one query', async () => {
    const em = orm.em.fork();
    const mock = mockLogger(orm);
    const { items, totalCount } = await em.findWithSelection(
      Item,
      { tenant: 1 },
      {
        selection: { ids: [3, 3, 5, 99], match: { reviews: { body: 'match' } } },
        populate: ['reviews'],
        strategy: LoadStrategy.JOINED,
        limit: 1,
        offset: 1,
        orderBy: { id: 'asc' },
      },
    );

    expect(items.map(item => item.id)).toEqual([3, 2]);
    expect(items[0].reviews).toHaveLength(0);
    expect(items[1].reviews).toHaveLength(2);
    expect(totalCount).toBe(2);
    expect(mock.mock.calls.filter(call => call[0].includes('[query]'))).toHaveLength(2);
  });

  test('joins every primary-key column and supports non-default column names', async () => {
    const { items, totalCount } = await orm.em.fork().findWithSelection(
      CompositeItem,
      { tenant: 1 },
      {
        selection: {
          ids: [
            [1, 'c2'],
            [1, 'c2'],
            [2, 'c5'],
          ],
        },
        limit: 1,
        offset: 1,
        orderBy: { code: 'desc' },
      },
    );
    expect(items.map(item => item.code)).toEqual(['c2', 'c3']);
    expect(totalCount).toBe(3);
  });

  test('supports a zero limit and an unbounded page', async () => {
    const em = orm.em.fork();
    const empty = await em.findWithSelection(Item, { tenant: 1 }, { selection: { ids: [2] }, limit: 0 });
    expect(empty.items.map(item => item.id)).toEqual([2]);
    expect(empty.totalCount).toBe(3);
    const unbounded = await em.findWithSelection(Item, { tenant: 1 }, { selection: { ids: [2] }, includeCount: false });
    expect(unbounded.items.map(item => item.id)).toEqual([2, 1, 3, 4]);
    expect(unbounded.totalCount).toBeUndefined();
  });
});
