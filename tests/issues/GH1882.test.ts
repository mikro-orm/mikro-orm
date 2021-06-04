import { Entity, PrimaryKey, Property, MikroORM, ManyToOne, OneToMany, Collection, Logger, BigIntType } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';

@Entity()
export class Foo {

  @PrimaryKey({ type: BigIntType })
  id!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
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

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Foo, Bar],
      dbName: `:memory:`,
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
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

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });
    const cond =  { $or: [{ barItems: '5678' }, { name: 'fooName' }] };

    const res = await orm.em.find(
      Foo,
      cond,
      { populate: ['barItems'] },
    );

    const queries = mock.mock.calls;
    expect(queries[0][0]).toMatch('select `e0`.* from `foo` as `e0` left join `bar` as `e1` on `e0`.`id` = `e1`.`foo_id` where (`e1`.`id` = ? or `e0`.`name` = ?)');
    expect(queries[1][0]).toMatch('select `e0`.* from `bar` as `e0` where `e0`.`foo_id` in (?) and `e0`.`id` = ? order by `e0`.`foo_id` asc');
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

    const mock = jest.fn();
    const logger = new Logger(mock, ['query']);
    Object.assign(orm.config, { logger });
    const cond =  { $and: [{ barItems: '3456' }] };

    const res = await orm.em.find(
      Foo,
      cond,
      { populate: ['barItems'] },
    );
    orm.em.clear();

    const queries = mock.mock.calls;
    expect(queries[0][0]).toMatch('select `e0`.* from `foo` as `e0` left join `bar` as `e1` on `e0`.`id` = `e1`.`foo_id` where `e1`.`id` = ?');
    expect(queries[1][0]).toMatch('select `e0`.* from `bar` as `e0` where `e0`.`foo_id` in (?) and `e0`.`id` = ? order by `e0`.`foo_id` asc');
  });

});
