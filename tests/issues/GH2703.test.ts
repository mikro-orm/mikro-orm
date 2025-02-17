import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => Order, ({ user }) => user)
  orders: Collection<Order> = new Collection<Order>(this);

}

@Entity()
export class Order {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ deleteRule: 'cascade' })
  user!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User, Order],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 2703`, async () => {
  const user = new User();
  user.orders.add(new Order(), new Order(), new Order());
  await orm.em.fork().persistAndFlush(user);
  const u = await orm.em.findOneOrFail(User, user, { populate: ['orders'] });
  const mock = mockLogger(orm);
  await orm.em.removeAndFlush(u);
  expect(mock).toHaveBeenCalledTimes(3);
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('delete from `user` where `id` in (1)');
  expect(mock.mock.calls[2][0]).toMatch('commit');
});
