import { MikroORM, Entity, LoadStrategy, OneToOne, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date;

  @Property()
  username!: string;

  @Property()
  isActive!: boolean;

}

@Entity()
class Customer {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date;

  @Property()
  name!: string;

  @OneToOne(() => User)
  user!: User;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Customer, User],
    loadStrategy: LoadStrategy.JOINED,
    loggerFactory: SimpleLogger.create,
  });
  await orm.getSchemaGenerator().refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test(`GH issue 3576`, async () => {
  const user = orm.em.create(User, { username: 'john111', isActive: true });
  const customer = orm.em.create(Customer, { name: 'John Doe', user });
  await orm.em.flush();

  const loadedCustomer = await orm.em.findOneOrFail(Customer, customer, { populate: ['user'] });

  const mock = mockLogger(orm, ['query']);
  loadedCustomer.name = 'Jane Doe';
  await orm.em.flush();

  expect(mock.mock.calls).toEqual([
    ['[query] begin'],
    ['[query] update `customer` set `name` = ?, `updated_at` = ? where `id` = ?'],
    ['[query] commit'],
  ]);
});
