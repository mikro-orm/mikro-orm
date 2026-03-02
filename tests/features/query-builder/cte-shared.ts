import { type Ref, raw } from '@mikro-orm/core';
import { type MikroORM, type AbstractSqlDriver } from '@mikro-orm/sql';
import { Entity, PrimaryKey, Property, ManyToOne, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
export class Author {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  age?: number;

}

@Entity()
export class Book {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @ManyToOne(() => Author)
  author!: Ref<Author>;

}

export const cteEntities = [Author, Book];
export const cteMetadataProvider = ReflectMetadataProvider;

export function cteIntegrationTests(getOrm: () => MikroORM<AbstractSqlDriver>) {

  beforeEach(async () => {
    const orm = getOrm();
    await orm.em.nativeDelete(Book, {});
    await orm.em.nativeDelete(Author, {});
    orm.em.clear();
  });

  test('CTE select', async () => {
    const orm = getOrm();
    orm.em.create(Author, { name: 'Alice', age: 30 });
    orm.em.create(Author, { name: 'Bob', age: 50 });
    await orm.em.flush();
    orm.em.clear();

    const sub = orm.em.createQueryBuilder(Author, 'a').select(['a.id', 'a.name']).where({ age: { $gte: 40 } });
    const qb = orm.em.createQueryBuilder(Author, 'a2')
      .with('older', sub)
      .select('*')
      .where({ age: { $gte: 40 } });

    const results = await qb.getResultList();
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Bob');
  });

  test('CTE with FROM string overload', async () => {
    const orm = getOrm();
    orm.em.create(Author, { name: 'Alice', age: 25 });
    orm.em.create(Author, { name: 'Bob', age: 35 });
    await orm.em.flush();
    orm.em.clear();

    const sub = orm.em.createQueryBuilder(Author, 'a').select(['a.name', 'a.age']).where({ age: { $gte: 30 } });
    const qb = orm.em.createQueryBuilder(Author)
      .with('older_authors', sub)
      .select('*')
      .from('older_authors', 'oa');

    const rows = await qb.execute<{ name: string; age: number }[]>();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Bob');
  });

  test('recursive CTE', async () => {
    const orm = getOrm();
    const qb = orm.em.createQueryBuilder(Author)
      .withRecursive('seq', raw('select 1 as n union all select n + 1 from seq where n < ?', [5]))
      .select('*')
      .from('seq', 's');

    const rows = await qb.execute<{ n: number }[]>();
    expect(rows).toHaveLength(5);
    expect(rows.map((r: { n: number }) => r.n)).toEqual([1, 2, 3, 4, 5]);
  });

  test('CTE with getCount()', async () => {
    const orm = getOrm();
    orm.em.create(Author, { name: 'A', age: 40 });
    orm.em.create(Author, { name: 'B', age: 50 });
    orm.em.create(Author, { name: 'C', age: 20 });
    await orm.em.flush();
    orm.em.clear();

    const sub = orm.em.createQueryBuilder(Author, 'a').select('*').where({ age: { $gte: 40 } });
    const qb = orm.em.createQueryBuilder(Author, 'a2')
      .with('old_authors', sub)
      .select('*')
      .where({ age: { $gte: 40 } });

    const count = await qb.getCount();
    expect(count).toBe(2);
  });

  test('multiple CTEs', async () => {
    const orm = getOrm();
    const a = orm.em.create(Author, { name: 'MultiCTE', age: 33 });
    orm.em.create(Book, { title: 'CTE Book', author: a });
    await orm.em.flush();
    orm.em.clear();

    const authorsCte = orm.em.createQueryBuilder(Author, 'a').select(['a.id', 'a.name']).where({ name: 'MultiCTE' });
    const booksCte = orm.em.createQueryBuilder(Book, 'b').select(['b.id', 'b.title']).where({ title: 'CTE Book' });

    const qb = orm.em.createQueryBuilder(Author, 'a2')
      .with('a_cte', authorsCte)
      .with('b_cte', booksCte)
      .select('*')
      .where({ name: 'MultiCTE' });

    const results = await qb.getResultList();
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('MultiCTE');
  });

  test('CTE with entity QB body used in FROM', async () => {
    const orm = getOrm();
    orm.em.create(Author, { name: 'X', age: 10 });
    orm.em.create(Author, { name: 'Y', age: 60 });
    await orm.em.flush();
    orm.em.clear();

    const sub = orm.em.createQueryBuilder(Author, 'a').select('*').where({ age: { $gt: 50 } });
    const qb = orm.em.createQueryBuilder(Author)
      .with('seniors', sub)
      .select('*')
      .from('seniors', 's');

    const rows = await qb.execute<{ name: string }[]>();
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Y');
  });

  test('duplicate CTE name throws', () => {
    const orm = getOrm();
    const sub = orm.em.createQueryBuilder(Author, 'a').select('*');
    expect(() => {
      orm.em.createQueryBuilder(Author, 'a2')
        .with('cte', sub)
        .with('cte', sub);
    }).toThrow(`CTE with name 'cte' already exists`);
  });
}
