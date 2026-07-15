import { MikroORM, RequestContext, defineEntity, p, type EntityManager } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

const Book = defineEntity({
  name: 'Book',
  properties: {
    id: p.integer().primary(),
    tenantId: p.integer(),
    title: p.string(),
  },
  filters: {
    tenant: {
      name: 'tenant',
      cond: (args: { tenantId: number }) => ({ tenantId: args.tenantId }),
      default: true,
    },
  },
});

// the EM handed to a virtual entity `expression` callback is a fork of the calling EM, so filters registered or
// parametrized on the caller (here via `setFilterParams`) must apply to the callback's own queries too
const BookView = defineEntity({
  name: 'BookView',
  expression: async (em: EntityManager) => {
    const books = await em.find(Book, {});
    return books.map(b => ({ id: b.id, tenantId: b.tenantId, title: b.title }));
  },
  properties: {
    id: p.integer(),
    tenantId: p.integer(),
    title: p.string(),
  },
});

test('virtual expression callback inherits the caller filter params', async () => {
  const orm = await MikroORM.init({
    entities: [Book, BookView],
    dbName: ':memory:',
    driver: SqliteDriver,
  });
  await orm.schema.create();
  await orm.em.insert(Book, { id: 1, tenantId: 1, title: 'a' });
  await orm.em.insert(Book, { id: 2, tenantId: 2, title: 'b' });

  // inside a request context, the callback EM must still see the request EM's filter params without
  // resolving back to it (its queries have to run under the caller's transaction/session context)
  await RequestContext.create(orm.em, async () => {
    const em = RequestContext.getEntityManager()!;
    em.setFilterParams('tenant', { tenantId: 1 });
    const res = await em.find(BookView, {});
    expect(res).toEqual([{ id: 1, tenantId: 1, title: 'a' }]);
  });

  // and outside of one too
  const em = orm.em.fork();
  em.setFilterParams('tenant', { tenantId: 2 });
  const res = await em.find(BookView, {});
  expect(res).toEqual([{ id: 2, tenantId: 2, title: 'b' }]);

  await orm.close(true);
});
