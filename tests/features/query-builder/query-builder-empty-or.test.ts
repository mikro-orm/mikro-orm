import { MikroORM } from '@mikro-orm/sqlite';
import { Author4 } from '../../entities-schema/index.js';
import { initORMSqlite } from '../../bootstrap.js';

// an empty disjunction matches nothing, so it has to compile to an always-false predicate
// rather than disappearing from the query, the way `$in: []` already does, while an empty
// conjunction is vacuously true and must not leave a dangling `not`/`having` behind
describe('empty condition groups', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORMSqlite();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('compiles to an always-false predicate', () => {
    const qb = orm.em.createQueryBuilder(Author4, 'a').where({ $or: [] });

    expect(qb.getFormattedQuery()).toBe('select `a`.* from `author4` as `a` where 1 = 0');
  });

  test('stays always-false when nested in a conjunction', () => {
    const qb = orm.em.createQueryBuilder(Author4, 'a').where({ $and: [{ name: 'foo' }, { $or: [] }] });

    expect(qb.getFormattedQuery()).toBe("select `a`.* from `author4` as `a` where `a`.`name` = 'foo' and 1 = 0");
  });

  test('an empty $and is still vacuously true', () => {
    const qb = orm.em.createQueryBuilder(Author4, 'a').where({ $and: [] });

    expect(qb.getFormattedQuery()).toBe('select `a`.* from `author4` as `a`');
  });

  test('negating an empty $or produces valid sql', () => {
    const qb = orm.em.createQueryBuilder(Author4, 'a').where({ $not: { $or: [] } });

    expect(qb.getFormattedQuery()).toBe('select `a`.* from `author4` as `a` where not (1 = 0)');
  });

  test('does not leave a dangling having clause', () => {
    const qb = orm.em.createQueryBuilder(Author4, 'a').groupBy('a.id').having({ $or: [] });

    expect(qb.getFormattedQuery()).toBe('select `a`.* from `author4` as `a` group by `a`.`id` having 1 = 0');
  });

  test('deletes are scoped rather than affecting the whole table', () => {
    const qb = orm.em.createQueryBuilder(Author4).delete({ $or: [] });

    expect(qb.getFormattedQuery()).toBe('delete from `author4` where 1 = 0');
  });

  test('negating a vacuously true condition matches nothing', async () => {
    const qb1 = orm.em.createQueryBuilder(Author4, 'a').where({ $not: {} });
    const qb2 = orm.em.createQueryBuilder(Author4, 'a').where({ $not: { $and: [] } });
    const qb3 = orm.em.createQueryBuilder(Author4, 'a').where({ $not: { $not: {} } });

    expect(qb1.getFormattedQuery()).toBe('select `a`.* from `author4` as `a` where 1 = 0');
    expect(qb2.getFormattedQuery()).toBe('select `a`.* from `author4` as `a` where 1 = 0');
    expect(qb3.getFormattedQuery()).toBe('select `a`.* from `author4` as `a` where not (1 = 0)');

    await expect(qb1.execute()).resolves.toEqual([]);
    await expect(qb2.execute()).resolves.toEqual([]);
    await expect(qb3.execute()).resolves.toEqual([]);
  });

  test('negating a vacuously true condition works nested in a group', async () => {
    const qb1 = orm.em.createQueryBuilder(Author4, 'a').where({ $and: [{ name: 'foo' }, { $not: { $and: [] } }] });
    const qb2 = orm.em.createQueryBuilder(Author4, 'a').where({ $or: [{ name: 'foo' }, { $not: { $and: [] } }] });

    expect(qb1.getFormattedQuery()).toBe("select `a`.* from `author4` as `a` where `a`.`name` = 'foo' and 1 = 0");
    expect(qb2.getFormattedQuery()).toBe("select `a`.* from `author4` as `a` where (`a`.`name` = 'foo' or 1 = 0)");

    await expect(qb1.execute()).resolves.toEqual([]);
    await expect(qb2.execute()).resolves.toEqual([]);
  });

  test('empty conditions are negated the same way when queried via the entity manager', async () => {
    await expect(orm.em.fork().find(Author4, { $not: {} })).resolves.toEqual([]);
    await expect(orm.em.fork().count(Author4, { $not: { $and: [] } })).resolves.toBe(0);
  });

  test('a vacuously true having condition is omitted', async () => {
    const qb1 = orm.em.createQueryBuilder(Author4, 'a').groupBy('a.id').having({ $and: [] });
    const qb2 = orm.em.createQueryBuilder(Author4, 'a').groupBy('a.id').having({});
    const qb3 = orm.em.createQueryBuilder(Author4, 'a').groupBy('a.id');
    qb3.having({ $or: [{ $and: [] }] });

    expect(qb1.getFormattedQuery()).toBe('select `a`.* from `author4` as `a` group by `a`.`id`');
    expect(qb2.getFormattedQuery()).toBe('select `a`.* from `author4` as `a` group by `a`.`id`');
    expect(qb3.getFormattedQuery()).toBe('select `a`.* from `author4` as `a` group by `a`.`id`');

    await expect(qb1.execute()).resolves.toEqual([]);
    await expect(qb3.execute()).resolves.toEqual([]);
  });

  test('a negated empty group in having is always false', async () => {
    const qb = orm.em.createQueryBuilder(Author4, 'a').groupBy('a.id');
    qb.having({ $not: { $and: [] } });

    expect(qb.getFormattedQuery()).toBe('select `a`.* from `author4` as `a` group by `a`.`id` having 1 = 0');

    await expect(qb.execute()).resolves.toEqual([]);
  });
});
