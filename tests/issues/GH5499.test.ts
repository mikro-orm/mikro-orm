import { IDatabaseDriver, MikroORM, Utils } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../helpers.js';
import { PLATFORMS } from '../bootstrap.js';

@Entity()
class User {

  @PrimaryKey({ name: '_id' })
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'json' })
  foo!: object;

  constructor(name: string, foo: object) {
    this.name = name;
    this.foo = foo;
  }

}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: '5499', port: 3308 },
  mariadb: { dbName: '5499', port: 3309 },
  postgresql: { dbName: '5499' },
};

describe.each(Utils.keys(options))('GH #5499 [%s]',  type => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      driver: PLATFORMS[type],
      entities: [User],
      forceEntityConstructor: true,
      ...options[type],
    });
    await orm.schema.refreshDatabase();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('5499', async () => {
    orm.em.create(User, { name: 'Foo', foo: { a: 1 } });
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
});
