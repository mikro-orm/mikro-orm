import {
  Collection,
  Entity,
  Filter,
  ManyToMany,
  ManyToOne,
  MikroORM,
  PrimaryKey,
  Property,
  QueryHelper,
} from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

let orm: MikroORM;

@Entity({ abstract: true })
abstract class Base {

  @PrimaryKey()
  id!: number;

}

@Entity()
class Account extends Base {

  @Property()
  name!: string;

}

@Entity()
@Filter({
  cond: () => ({ account: { id: { $in: [1] } } }),
  name: 'accounts',
})
class Car extends Base {

  @Property()
  brand!: string;

  @ManyToOne({
    entity: () => Account,
    deleteRule: 'cascade',
  })
  account!: Account;

  @ManyToMany(() => Tag)
  tags: Collection<Tag> = new Collection<Tag>(this);

}

@Entity()
class Tag extends Base {

  @ManyToOne({
    entity: () => Account,
    deleteRule: 'cascade',
    nullable: true,
  })
  account!: Account | null;

  @Property()
  name!: string;

}

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Base, Account, Tag, Car],
    loadStrategy: 'select-in',
  });
  await orm.schema.refreshDatabase();
  const account = orm.em.create(Account, { id: 1, name: 'Car enjoyer 123' });
  const tag = orm.em.create(Tag, { id: 1, name: 'super fast', account });
  orm.em.create(Car, { id: 1, account, brand: 'audi', tags: [tag] });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

test('this works', async () => {
  // using filter on Tag without logical operators
  orm.em.addFilter({ name: 'accounts', cond: () => ({ account: { id: { $in: [1] } } }), entity: Tag });
  const cars = await orm.em.find(Car, {
    $and: [
      { brand: 'audi' },
      { tags: { name: 'super fast' } },
    ],
  }, { populate: ['account', 'tags.account'], filters: ['accounts'] });

  expect(cars.length).toEqual(1);
});

test('this also works', async () => {
  // using filter on Tag with logical operator
  orm.em.addFilter({ name: 'accounts', cond: () => (({ account: { $and: [{ id: { $in: [1] } }, { id: { $eq: null } }] } })), entity: Tag });
  const cars = await orm.em.fork().find(Car, {
    $and: [
      { brand: 'audi' },
    ],
  }, { populate: ['account', 'tags.account'], filters: ['accounts'] });

  expect(cars.length).toEqual(1);
});

test('query reduction', async () => {
  const where = { account: { $or: [{ id: { $in: [1] } }, { id: { $eq: null } }] } };
  const meta = orm.getMetadata(Tag);

  QueryHelper.liftGroupOperators(where, meta, orm.getMetadata());
  expect(where).toEqual({
    $or: [
      {
        account: { id: { $in: [ 1 ] } },
      },
      { account: { id: { $eq: null } } },
    ],
  });

  QueryHelper.inlinePrimaryKeyObjects(where, meta, orm.getMetadata());
  expect(where).toEqual({
    $or: [
      {
        account: { $in: [ 1 ] },
      },
      { account: { $eq: null } },
    ],
  });
});

test('reproduce bug', async () => {
  // using filter on Tag with logical operator
  orm.em.addFilter({ name: 'accounts', cond: () => ({ account: { $or: [{ id: { $in: [1] } }, { id: { $eq: null } }] } }), entity: Tag });

  const mock = mockLogger(orm);
  const cars = await orm.em.fork().find(Car, {
    $and: [
      { brand: 'audi' },
      { tags: { name: 'super fast' } },
    ],
  }, { populate: ['account', 'tags.account'], filters: ['accounts'] });
  expect(cars.length).toEqual(1);
  expect(mock.mock.calls[0][0]).toMatch("select `c0`.* from `car` as `c0` left join `car_tags` as `c2` on `c0`.`id` = `c2`.`car_id` left join `tag` as `c1` on `c2`.`tag_id` = `c1`.`id` and (`c1`.`account_id` in (1) or `c1`.`account_id` is null) where `c0`.`account_id` in (1) and `c0`.`brand` = 'audi' and `c1`.`name` = 'super fast'");
  expect(mock.mock.calls[1][0]).toMatch('select `a0`.* from `account` as `a0` where `a0`.`id` in (1)');
  expect(mock.mock.calls[2][0]).toMatch('select `c0`.`tag_id`, `c0`.`car_id`, `t1`.`id` as `t1__id`, `t1`.`account_id` as `t1__account_id`, `t1`.`name` as `t1__name` from `car_tags` as `c0` inner join `tag` as `t1` on `c0`.`tag_id` = `t1`.`id` where `c0`.`car_id` in (1) and (`t1`.`account_id` in (1) or `t1`.`account_id` is null)');
});
