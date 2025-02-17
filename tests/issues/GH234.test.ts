import { Collection, Entity, ManyToMany, MikroORM, PopulateHint, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => B, b => b.aCollection)
  bCollection = new Collection<B>(this);

}

@Entity()
export class B {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => A, undefined, { fixedOrder: true })
  aCollection = new Collection<A>(this);

}

describe('GH issue 234', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();

    const a1 = new A();
    a1.id = 1;
    a1.name = 'a1';
    const a2 = new A();
    a2.id = 2;
    a2.name = 'a2';
    const a3 = new A();
    a3.id = 3;
    a3.name = 'a3';
    const b = new B();
    b.id = 1;
    b.name = 'b';
    b.aCollection.add(a1, a2, a3);
    await orm.em.fork().persistAndFlush(b);
  });

  afterAll(() => orm.close(true));

  test('search by m:n (select-in)', async () => {
    const mock = mockLogger(orm, ['query']);
    const res1 = await orm.em.find(B, { aCollection: [1, 2, 3] }, { populate: ['aCollection'], strategy: 'select-in', populateWhere: PopulateHint.INFER });
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.* from `b` as `b0` left join `b_a_collection` as `b1` on `b0`.`id` = `b1`.`b_id` where `b1`.`a_id` in (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `a1`.*, `b0`.`a_id` as `fk__a_id`, `b0`.`b_id` as `fk__b_id` from `b_a_collection` as `b0` inner join `a` as `a1` on `b0`.`a_id` = `a1`.`id` where `a1`.`id` in (?, ?, ?) and `b0`.`b_id` in (?) order by `b0`.`id` asc');
    expect(res1.map(b => b.id)).toEqual([1]);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find(A, { bCollection: [1, 2, 3] }, { populate: ['bCollection'], strategy: 'select-in', populateWhere: PopulateHint.INFER });
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.* from `a` as `a0` left join `b_a_collection` as `b1` on `a0`.`id` = `b1`.`a_id` where `b1`.`b_id` in (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `b1`.*, `b0`.`a_id` as `fk__a_id`, `b0`.`b_id` as `fk__b_id` from `b_a_collection` as `b0` inner join `b` as `b1` on `b0`.`b_id` = `b1`.`id` where `b1`.`id` in (?, ?, ?) and `b0`.`a_id` in (?, ?, ?) order by `b0`.`id` asc');
    expect(res2.map(a => a.id)).toEqual([1, 2, 3]);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const res3 = await orm.em.find(B, { aCollection: [1, 2, 3] }, { populate: ['aCollection'], strategy: 'select-in' });
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.* from `b` as `b0` left join `b_a_collection` as `b1` on `b0`.`id` = `b1`.`b_id` where `b1`.`a_id` in (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `a1`.*, `b0`.`a_id` as `fk__a_id`, `b0`.`b_id` as `fk__b_id` from `b_a_collection` as `b0` inner join `a` as `a1` on `b0`.`a_id` = `a1`.`id` where `b0`.`b_id` in (?) order by `b0`.`id` asc');
    expect(res3.map(b => b.id)).toEqual([1]);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(A, { bCollection: [1, 2, 3] }, { populate: ['bCollection'], strategy: 'select-in' });
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.* from `a` as `a0` left join `b_a_collection` as `b1` on `a0`.`id` = `b1`.`a_id` where `b1`.`b_id` in (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `b1`.*, `b0`.`a_id` as `fk__a_id`, `b0`.`b_id` as `fk__b_id` from `b_a_collection` as `b0` inner join `b` as `b1` on `b0`.`b_id` = `b1`.`id` where `b0`.`a_id` in (?, ?, ?) order by `b0`.`id` asc');
    expect(res4.map(a => a.id)).toEqual([1, 2, 3]);
    orm.em.clear();
    mock.mock.calls.length = 0;
  });

  test('search by m:n (joined)', async () => {
    const mock = mockLogger(orm, ['query']);
    const res1 = await orm.em.find(B, { aCollection: [1, 2, 3] }, { populate: ['aCollection'], populateWhere: PopulateHint.INFER });
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.*, `a1`.`id` as `a1__id`, `a1`.`name` as `a1__name` from `b` as `b0` left join `b_a_collection` as `b2` on `b0`.`id` = `b2`.`b_id` and `b2`.`a_id` in (?, ?, ?) left join `a` as `a1` on `b2`.`a_id` = `a1`.`id` where `b2`.`a_id` in (?, ?, ?) order by `b2`.`id` asc');
    expect(res1.map(b => b.id)).toEqual([1]);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find(A, { bCollection: [1, 2, 3] }, { populate: ['bCollection'], populateWhere: PopulateHint.INFER });
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`id` as `b1__id`, `b1`.`name` as `b1__name` from `a` as `a0` left join `b_a_collection` as `b2` on `a0`.`id` = `b2`.`a_id` and `b2`.`b_id` in (?, ?, ?) left join `b` as `b1` on `b2`.`b_id` = `b1`.`id` where `b2`.`b_id` in (?, ?, ?) order by `b2`.`id` asc');
    expect(res2.map(a => a.id)).toEqual([1, 2, 3]);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const res3 = await orm.em.find(B, { aCollection: [1, 2, 3] }, { populate: ['aCollection'], strategy: 'select-in' });
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.* from `b` as `b0` left join `b_a_collection` as `b1` on `b0`.`id` = `b1`.`b_id` where `b1`.`a_id` in (?, ?, ?)');
    expect(res3.map(b => b.id)).toEqual([1]);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(A, { bCollection: [1, 2, 3] }, { populate: ['bCollection'] });
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.*, `b1`.`id` as `b1__id`, `b1`.`name` as `b1__name` from `a` as `a0` left join `b_a_collection` as `b2` on `a0`.`id` = `b2`.`a_id` left join `b` as `b1` on `b2`.`b_id` = `b1`.`id` left join `b_a_collection` as `b3` on `a0`.`id` = `b3`.`a_id` where `b3`.`b_id` in (?, ?, ?) order by `b2`.`id` asc');
    expect(res4.map(a => a.id)).toEqual([1, 2, 3]);
    orm.em.clear();
    mock.mock.calls.length = 0;
  });

});
