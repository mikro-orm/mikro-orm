import { raw } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

describe('named parameters in raw() helper', () => {
  test('binds values in SQL-placeholder order, not object-key order', () => {
    const fragment = raw('select :b as b, :a as a', { a: 1, b: 2 });
    expect(fragment.sql).toBe('select ? as b, ? as a');
    expect(fragment.params).toEqual([2, 1]);
  });

  test('supports repeated named parameters', () => {
    const fragment = raw('select * from geo where city = :city or country = :city', { city: 'Brno' });
    expect(fragment.sql).toBe('select * from geo where city = ? or country = ?');
    expect(fragment.params).toEqual(['Brno', 'Brno']);
  });

  test('does not corrupt parameters sharing a prefix', () => {
    const fragment = raw('select :cityCode as code, :city as city', { city: 'Brno', cityCode: 'BRQ' });
    expect(fragment.sql).toBe('select ? as code, ? as city');
    expect(fragment.params).toEqual(['BRQ', 'Brno']);
  });

  test('supports keys containing $', () => {
    const fragment = raw('select :$price as p, :price$net as n', { $price: 100, price$net: 80 });
    expect(fragment.sql).toBe('select ? as p, ? as n');
    expect(fragment.params).toEqual([100, 80]);
  });

  test('quotes identifiers via :name: syntax', () => {
    const fragment = raw('select :col: from :tbl: where :col: = :val', { col: 'name', tbl: 'user', val: 'x' });
    expect(fragment.sql).toBe('select ?? from ?? where ?? = ?');
    expect(fragment.params).toEqual(['name', 'user', 'name', 'x']);
  });

  test('ignores postgres :: casts', () => {
    const fragment = raw(`select '[1]'::jsonb, :val::text`, { val: 'x' });
    expect(fragment.sql).toBe(`select '[1]'::jsonb, ?::text`);
    expect(fragment.params).toEqual(['x']);
  });

  test('leaves tokens without a matching key untouched', () => {
    const fragment = raw('select :known, :unknown', { known: 1 });
    expect(fragment.sql).toBe('select ?, :unknown');
    expect(fragment.params).toEqual([1]);
  });

  test('works end to end via em.execute (GH #8093)', async () => {
    const orm = await MikroORM.init({ dbName: ':memory:', discovery: { warnWhenNoEntities: false } });
    await orm.em.execute('create table geo_seed (country text, region text, city text)');

    const [country, region, city] = ['CZ', 'South Moravia', 'Brno'];
    await orm.em.execute(
      raw('insert into geo_seed (country, region, city) values (:country, :region, :city)', { country, region, city }),
    );

    const res = await orm.em.execute(raw('select * from geo_seed where city = :city or region = :city', { city }));
    expect(res).toEqual([{ country: 'CZ', region: 'South Moravia', city: 'Brno' }]);

    await orm.close(true);
  });

  test('named parameters work directly in em.execute and connection.execute (GH #8093)', async () => {
    const orm = await MikroORM.init({ dbName: ':memory:', discovery: { warnWhenNoEntities: false } });
    await orm.em.execute('create table geo_seed (country text, region text, city text)');

    const [country, region, city] = ['CZ', 'South Moravia', 'Brno'];
    await orm.em.execute('insert into geo_seed (country, region, city) values (:country, :region, :city)', {
      country,
      region,
      city,
    });

    const res = await orm.em.execute('select * from geo_seed where city = :city or region = :city', { city });
    expect(res).toEqual([{ country: 'CZ', region: 'South Moravia', city: 'Brno' }]);

    const res2 = await orm.em.getConnection().execute('select * from geo_seed where city = :city', { city }, 'get');
    expect(res2).toEqual({ country: 'CZ', region: 'South Moravia', city: 'Brno' });

    await orm.close(true);
  });
});
