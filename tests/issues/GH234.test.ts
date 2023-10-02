import { Collection, Entity, ManyToMany, MikroORM, PopulateHint, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers';

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
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test('search by m:n', async () => {
    const a1 = new A();
    a1.name = 'a1';
    const a2 = new A();
    a2.name = 'a2';
    const a3 = new A();
    a3.name = 'a3';
    const b = new B();
    b.name = 'b';
    b.aCollection.add(a1, a2, a3);
    await orm.em.persistAndFlush(b);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const res1 = await orm.em.find(B, { aCollection: [1, 2, 3] }, { populate: ['aCollection'], populateWhere: PopulateHint.INFER });
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.* from `b` as `b0` left join `b_a_collection` as `b1` on `b0`.`id` = `b1`.`b_id` where `b1`.`a_id` in (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `a1`.*, `b0`.`a_id` as `fk__a_id`, `b0`.`b_id` as `fk__b_id` from `b_a_collection` as `b0` inner join `a` as `a1` on `b0`.`a_id` = `a1`.`id` where `a1`.`id` in (?, ?, ?) and `b0`.`b_id` in (?) order by `b0`.`id` asc');
    expect(res1.map(b => b.id)).toEqual([b.id]);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res2 = await orm.em.find(A, { bCollection: [1, 2, 3] }, { populate: ['bCollection'], populateWhere: PopulateHint.INFER });
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.* from `a` as `a0` left join `b_a_collection` as `b1` on `a0`.`id` = `b1`.`a_id` where `b1`.`b_id` in (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `b1`.*, `b0`.`a_id` as `fk__a_id`, `b0`.`b_id` as `fk__b_id` from `b_a_collection` as `b0` inner join `b` as `b1` on `b0`.`b_id` = `b1`.`id` where `b1`.`id` in (?, ?, ?) and `b0`.`a_id` in (?, ?, ?) order by `b0`.`id` asc');
    expect(res2.map(a => a.id)).toEqual([a1.id, a2.id, a3.id]);
    orm.em.clear();
    mock.mock.calls.length = 0;

    const res3 = await orm.em.find(B, { aCollection: [1, 2, 3] }, { populate: ['aCollection'] });
    expect(mock.mock.calls[0][0]).toMatch('select `b0`.* from `b` as `b0` left join `b_a_collection` as `b1` on `b0`.`id` = `b1`.`b_id` where `b1`.`a_id` in (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `a1`.*, `b0`.`a_id` as `fk__a_id`, `b0`.`b_id` as `fk__b_id` from `b_a_collection` as `b0` inner join `a` as `a1` on `b0`.`a_id` = `a1`.`id` where `b0`.`b_id` in (?) order by `b0`.`id` asc');
    expect(res3.map(b => b.id)).toEqual([b.id]);

    orm.em.clear();
    mock.mock.calls.length = 0;
    const res4 = await orm.em.find(A, { bCollection: [1, 2, 3] }, { populate: ['bCollection'] });
    expect(mock.mock.calls[0][0]).toMatch('select `a0`.* from `a` as `a0` left join `b_a_collection` as `b1` on `a0`.`id` = `b1`.`a_id` where `b1`.`b_id` in (?, ?, ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `b1`.*, `b0`.`a_id` as `fk__a_id`, `b0`.`b_id` as `fk__b_id` from `b_a_collection` as `b0` inner join `b` as `b1` on `b0`.`b_id` = `b1`.`id` where `b0`.`a_id` in (?, ?, ?) order by `b0`.`id` asc');
    expect(res4.map(a => a.id)).toEqual([a1.id, a2.id, a3.id]);
    orm.em.clear();
    mock.mock.calls.length = 0;
  });

});
