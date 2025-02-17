import { Embeddable, Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers.js';

@Embeddable()
class Address {

  @Property()
  country!: string;

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  email!: string;

  @Embedded(() => Address)
  address!: Address;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [User],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('cursor pagination', async () => {
  const mock = mockLogger(orm);
  await orm.em.find(User, {}, { first: 100, orderBy: { email: 'ASC' } });
  await orm.em.find(User, {}, { limit: 100, orderBy: { email: 'ASC' } });
  await orm.em.find(User, {}, { first: 100, orderBy: { address: { country: 'ASC' } } });
  await orm.em.find(User, {}, { limit: 100, orderBy: { address: { country: 'ASC' } } });
  expect(mock.mock.calls[0][0]).toMatch('select `u0`.* from `user` as `u0` order by `u0`.`email` asc limit 100');
  expect(mock.mock.calls[1][0]).toMatch('select `u0`.* from `user` as `u0` order by `u0`.`email` asc limit 100');
  expect(mock.mock.calls[2][0]).toMatch('select `u0`.* from `user` as `u0` order by `u0`.`address_country` asc limit 100');
  expect(mock.mock.calls[3][0]).toMatch('select `u0`.* from `user` as `u0` order by `u0`.`address_country` asc limit 100');
});
