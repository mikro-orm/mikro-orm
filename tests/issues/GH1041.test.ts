import { Collection, Entity, LoadStrategy, Logger, ManyToMany, MikroORM, PrimaryKey } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';

@Entity()
export class App {

  @PrimaryKey()
  id!: number;

  @ManyToMany('User', 'apps')
  users = new Collection<User>(this);

}

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @ManyToMany(() => App, a => a.users, { owner: true })
  apps = new Collection<App>(this);

}

describe('GH issue 1041', () => {

  let orm: MikroORM<AbstractSqlDriver>;
  const log = jest.fn();

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, App],
      dbName: ':memory:',
      type: 'sqlite',
    });
    const logger = new Logger(log, ['query', 'query-params']);
    Object.assign(orm.config, { logger });

    await orm.getSchemaGenerator().createSchema();

    const user = orm.em.create(User, { id: 123 });
    const app1 = orm.em.create(App, { id: 1 });
    const app2 = orm.em.create(App, { id: 2 });
    const app3 = orm.em.create(App, { id: 3 });
    user.apps.add(app1, app2, app3);
    await orm.em.persistAndFlush(user);
    orm.em.clear();
  });

  beforeEach(() => {
    log.mockReset();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('select-in strategy: populate with apps and remove one app', async () => {
    const user = await orm.em.findOneOrFail(User, { id: 123 }, { populate: { apps: LoadStrategy.SELECT_IN } });
    const app = user.apps.getItems().find(i => i.id === 2);

    user.apps.remove(app!);
    log.mockReset();
    await expect(orm.em.flush()).resolves.toBeUndefined();

    expect(log.mock.calls[0][0]).toMatch('begin');
    expect(log.mock.calls[1][0]).toMatch('delete from `user_apps` where (`app_id`) in ( values (2)) and `user_id` = 123');
    expect(log.mock.calls[2][0]).toMatch('commit');
  });

  test('joined strategy: populate with apps and remove one app', async () => {
    const user = await orm.em.findOneOrFail(User, { id: 123 }, { populate: { apps: LoadStrategy.JOINED } });
    const app = user.apps.getItems().find(i => i.id === 3);
    user.apps.remove(app!);
    log.mockReset();

    await expect(orm.em.flush()).resolves.toBeUndefined();

    expect(log.mock.calls[0][0]).toMatch('begin');
    expect(log.mock.calls[1][0]).toMatch('delete from `user_apps` where (`app_id`) in ( values (3)) and `user_id` = 123');
    expect(log.mock.calls[2][0]).toMatch('commit');
  });
});
