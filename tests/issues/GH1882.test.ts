import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PopulateHint, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
export class Foo {

  @PrimaryKey()
  id!: bigint;

  @OneToMany(() => Bar, bar => bar.foo)
  barItems = new Collection<Bar>(this);

  @Property()
  name!: string;

}

@Entity()
export class Bar {

  @PrimaryKey()
  id!: bigint;

  @ManyToOne(() => Foo)
  foo!: Foo;

  @Property()
  name!: string;

}

describe('GH issue 1882', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Foo, Bar],
      dbName: `:memory:`,
    });
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 1882-1`, async () => {
    const fooItem = new Foo();
    fooItem.id = 1234n;
    fooItem.name = 'fooName';

    const barItem = new Bar();
    barItem.id = 5678n;
    barItem.name = 'barName1';
    barItem.foo = fooItem;

    await orm.em.persistAndFlush([barItem]);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const cond =  { $or: [{ barItems: '5678' }, { name: 'fooName' }] };

    await orm.em.fork().find(Foo, cond, { populate: ['barItems'], populateWhere: PopulateHint.INFER, strategy: 'select-in' });
    expect(mock.mock.calls[0][0]).toMatch('select `f0`.* from `foo` as `f0` left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` where (`b1`.`id` = ? or `f0`.`name` = ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.* from `bar` as `b0` where `b0`.`foo_id` in (?) and `b0`.`id` = ?');
    mock.mockReset();

    await orm.em.fork().find(Foo, cond, { populate: ['barItems'], strategy: 'select-in' });
    expect(mock.mock.calls[0][0]).toMatch('select `f0`.* from `foo` as `f0` left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` where (`b1`.`id` = ? or `f0`.`name` = ?)');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.* from `bar` as `b0` where `b0`.`foo_id` in (?)');
  });

  test(`GH issue 1882-2`, async () => {
    const fooItem = new Foo();
    fooItem.id = 9012n;
    fooItem.name = 'fooName';

    const barItem = new Bar();
    barItem.id = 3456n;
    barItem.name = 'barName';
    barItem.foo = fooItem;

    await orm.em.persistAndFlush([barItem]);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const cond =  { $and: [{ barItems: '3456' }] };

    await orm.em.find(Foo, cond, { populate: ['barItems'], populateWhere: PopulateHint.INFER, strategy: 'select-in' });
    orm.em.clear();

    expect(mock.mock.calls[0][0]).toMatch('select `f0`.* from `foo` as `f0` left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` where `b1`.`id` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.* from `bar` as `b0` where `b0`.`foo_id` in (?) and `b0`.`id` = ?');
    mock.mockReset();

    await orm.em.find(Foo, cond, { populate: ['barItems'], strategy: 'select-in' });
    orm.em.clear();

    expect(mock.mock.calls[0][0]).toMatch('select `f0`.* from `foo` as `f0` left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` where `b1`.`id` = ?');
    expect(mock.mock.calls[1][0]).toMatch('select `b0`.* from `bar` as `b0` where `b0`.`foo_id` in (?)');
  });

  test(`GH issue 1882-3`, async () => {
    const fooItem = new Foo();
    fooItem.id = 12345n;
    fooItem.name = 'fooName';

    const barItem = new Bar();
    barItem.id = 56789n;
    barItem.name = 'barName1';
    barItem.foo = fooItem;

    await orm.em.persistAndFlush([barItem]);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const cond =  { $or: [{ barItems: '5678' }, { name: 'fooName' }] };

    await orm.em.fork().find(Foo, cond, { populate: ['barItems'], populateWhere: PopulateHint.INFER, strategy: 'joined' });
    expect(mock.mock.calls[0][0]).toMatch('select `f0`.*, ' +
      '`b1`.`id` as `b1__id`, `b1`.`foo_id` as `b1__foo_id`, `b1`.`name` as `b1__name` ' +
      'from `foo` as `f0` ' +
      'left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` and `b1`.`id` = ? ' +
      'where (`b1`.`id` = ? or `f0`.`name` = ?)');
    mock.mockReset();

    await orm.em.fork().find(Foo, cond, { populate: ['barItems'], strategy: 'joined' });
    expect(mock.mock.calls[0][0]).toMatch('select `f0`.*, ' +
      '`b1`.`id` as `b1__id`, `b1`.`foo_id` as `b1__foo_id`, `b1`.`name` as `b1__name` ' +
      'from `foo` as `f0` ' +
      'left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` ' +
      'left join `bar` as `b2` on `f0`.`id` = `b2`.`foo_id` ' +
      'where (`b2`.`id` = ? or `f0`.`name` = ?)');
  });

  test(`GH issue 1882-4`, async () => {
    const fooItem = new Foo();
    fooItem.id = 90121n;
    fooItem.name = 'fooName';

    const barItem = new Bar();
    barItem.id = 34561n;
    barItem.name = 'barName';
    barItem.foo = fooItem;

    await orm.em.persistAndFlush([barItem]);
    orm.em.clear();

    const mock = mockLogger(orm, ['query']);
    const cond =  { $and: [{ barItems: '3456' }] };

    await orm.em.find(Foo, cond, { populate: ['barItems'], populateWhere: PopulateHint.INFER, strategy: 'joined' });
    orm.em.clear();

    expect(mock.mock.calls[0][0]).toMatch('select `f0`.*, ' +
      '`b1`.`id` as `b1__id`, `b1`.`foo_id` as `b1__foo_id`, `b1`.`name` as `b1__name` ' +
      'from `foo` as `f0` ' +
      'left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` and `b1`.`id` = ? ' +
      'where `b1`.`id` = ?');
    mock.mockReset();

    await orm.em.find(Foo, cond, { populate: ['barItems'], strategy: 'joined' });
    orm.em.clear();

    expect(mock.mock.calls[0][0]).toMatch('select `f0`.*, ' +
      '`b1`.`id` as `b1__id`, `b1`.`foo_id` as `b1__foo_id`, `b1`.`name` as `b1__name` ' +
      'from `foo` as `f0` ' +
      'left join `bar` as `b1` on `f0`.`id` = `b1`.`foo_id` ' +
      'left join `bar` as `b2` on `f0`.`id` = `b2`.`foo_id` ' +
      'where `b2`.`id` = ?');
  });

});
