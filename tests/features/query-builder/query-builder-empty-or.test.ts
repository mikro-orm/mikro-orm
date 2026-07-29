import { MikroORM } from '@mikro-orm/sqlite';
import { Author4 } from '../../entities-schema/index.js';
import { initORMSqlite } from '../../bootstrap.js';

// an empty disjunction matches nothing, so it has to compile to an always-false predicate
// rather than disappearing from the query, the way `$in: []` already does
describe('empty $or', () => {
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
});
