import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/mariadb';
import { mockLogger } from '../helpers.js';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'json', unique: true })
  email!: object;

  constructor(name: string, email: object) {
    this.name = name;
    this.email = email;
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    forceEntityConstructor: true,
    dbName: '5499',
    port: 3309,
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('5499', async () => {
  orm.em.create(User, { name: 'Foo', email: { a: 1 } });
  await orm.em.flush();
  orm.em.clear();

  const mock = mockLogger(orm);
  await orm.em.transactional(async () => {
    const user = await orm.em.findOneOrFail(User, { name: 'Foo' });
  });
  expect(mock.mock.calls[0][0]).toMatch('begin');
  expect(mock.mock.calls[1][0]).toMatch('select');
  expect(mock.mock.calls[2][0]).toMatch('commit');
});
