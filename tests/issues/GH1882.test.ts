import { BigIntType, Collection, Entity, ManyToOne, MikroORM, OneToMany, PopulateHint, PrimaryKey, Property } from '@mikro-orm/core';
import { mockLogger } from '../helpers';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
export class Foo {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @OneToMany(() => Bar, bar => bar.foo)
  barItems = new Collection<Bar>(this);

  @Property()
  name!: string;

}

@Entity()
export class Bar {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  @ManyToOne(() => Foo)
  foo!: Foo;

  @Property()
  name!: string;

}

describe('GH issue 1882', () => {

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Foo, Bar],
      dbName: `:memory:`,
      driver: SqliteDriver,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 1882-1`, async () => {
    const fooItem = new Foo();
    fooItem.id = '1234';
    fooItem.name = 'fooName';

    const barItem = new Bar();
    barItem.id = '5678';
    barItem.name = 'barName1';
    barItem.foo = fooItem;

    await orm.em.persistAndFlush([barItem]);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const cond =  { $or: [{ barItems: '5678' }, { name: 'fooName' }] };

    await orm.em.fork().find(Foo, cond, { populate: ['barItems'], populateWhere: PopulateHint.INFER });
    expect(mock.mock.calls[0][0]).toMatch('select `f0`.* from `foo` as `f0` left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` where (`b1`.`id` = ? or `f0`.`name` = ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.* from `bar` as `b0` where `b0`.`foo_id` in (?) and `b0`.`id` = ? order by `b0`.`foo_id` asc');
    mock.mockReset();

    await orm.em.fork().find(Foo, cond, { populate: ['barItems'] });
    expect(mock.mock.calls[0][0]).toMatch('select `f0`.* from `foo` as `f0` left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` where (`b1`.`id` = ? or `f0`.`name` = ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.* from `bar` as `b0` where `b0`.`foo_id` in (?) order by `b0`.`foo_id` asc');
  });

  test(`GH issue 1882-2`, async () => {
    const fooItem = new Foo();
    fooItem.id = '9012';
    fooItem.name = 'fooName';

    const barItem = new Bar();
    barItem.id = '3456';
    barItem.name = 'barName';
    barItem.foo = fooItem;

    await orm.em.persistAndFlush([barItem]);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const cond =  { $and: [{ barItems: '3456' }] };

    await orm.em.find(Foo, cond, { populate: ['barItems'], populateWhere: PopulateHint.INFER });
    orm.em.clear();

    expect(mock.mock.calls[0][0]).toMatch('select `f0`.* from `foo` as `f0` left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` where `b1`.`id` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.* from `bar` as `b0` where `b0`.`foo_id` in (?) and `b0`.`id` = ? order by `b0`.`foo_id` asc');
    mock.mockReset();

    await orm.em.find(Foo, cond, { populate: ['barItems'] });
    orm.em.clear();

    expect(mock.mock.calls[0][0]).toMatch('select `f0`.* from `foo` as `f0` left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` where `b1`.`id` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.* from `bar` as `b0` where `b0`.`foo_id` in (?) order by `b0`.`foo_id` asc');
  });

});
