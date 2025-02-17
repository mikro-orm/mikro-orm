import { Collection, Entity, LoadStrategy, ManyToMany, MikroORM, PopulateHint, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { mockLogger } from '../helpers.js';

@Entity()
class App {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany('User', 'apps')
  users = new Collection<User>(this);

}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @ManyToMany(() => App, a => a.users, { owner: true })
  apps = new Collection<App>(this);

}

describe('GH issue 1041, 1043', () => {

  let orm: MikroORM;
  const log = vi.fn();

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User, App],
      dbName: ':memory:',
    });
    mockLogger(orm, ['query', 'query-params'], log);
    await orm.schema.createSchema();

    const user = orm.em.create(User, { id: 123, name: 'user' });
    const app1 = orm.em.create(App, { id: 1, name: 'app 1' });
    const app2 = orm.em.create(App, { id: 2, name: 'app 2' });
    const app3 = orm.em.create(App, { id: 3, name: 'app 3' });
    user.apps.add(app1, app2, app3);
    await orm.em.persistAndFlush(user);
  });

  beforeEach(() => {
    log.mockReset();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('select-in strategy: populate with apps and remove one app', async () => {
    const user = await orm.em.findOneOrFail(User, { id: 123 }, { populate: ['apps'], strategy: LoadStrategy.SELECT_IN });
    const app = user.apps.getItems().find(i => i.id === 2);

    user.apps.remove(app!);
    log.mockReset();
    await expect(orm.em.flush()).resolves.toBeUndefined();

    expect(log.mock.calls[0][0]).toMatch('begin');
    expect(log.mock.calls[1][0]).toMatch('delete from `user_apps` where `app_id` = 2 and `user_id` = 123');
    expect(log.mock.calls[2][0]).toMatch('commit');
  });

  test('joined strategy: populate with apps and remove one app', async () => {
    const user = await orm.em.findOneOrFail(User, { id: 123 }, { populate: ['apps'], strategy: LoadStrategy.JOINED });
    const app = user.apps.getItems().find(i => i.id === 3);
    user.apps.remove(app!);
    log.mockReset();

    await expect(orm.em.flush()).resolves.toBeUndefined();

    expect(log.mock.calls[0][0]).toMatch('begin');
    expect(log.mock.calls[1][0]).toMatch('delete from `user_apps` where `app_id` = 3 and `user_id` = 123');
    expect(log.mock.calls[2][0]).toMatch('commit');
  });

  test('select-in strategy: find by many-to-many relation ID', async () => {
    const findPromise = orm.em.findOne(User, { apps: 1 }, { populate: ['apps'], strategy: LoadStrategy.SELECT_IN });
    await expect(findPromise).resolves.toBeInstanceOf(User);
    expect(log.mock.calls[0][0]).toMatch('select `u0`.* from `user` as `u0` left join `user_apps` as `u1` on `u0`.`id` = `u1`.`user_id` where `u1`.`app_id` = 1 limit 1');
    expect(log.mock.calls[1][0]).toMatch('select `a1`.*, `u0`.`app_id` as `fk__app_id`, `u0`.`user_id` as `fk__user_id` from `user_apps` as `u0` inner join `app` as `a1` on `u0`.`app_id` = `a1`.`id` where `u0`.`user_id` in (123)');
  });

  test('joined strategy: find by many-to-many relation ID', async () => {
    const findPromise = orm.em.findOne(User, { apps: 1 }, { populate: ['apps'], strategy: LoadStrategy.JOINED });
    await expect(findPromise).resolves.toBeInstanceOf(User);
    expect(log.mock.calls[0][0]).toMatch('select `u0`.*, `a1`.`id` as `a1__id`, `a1`.`name` as `a1__name` from `user` as `u0` left join `user_apps` as `u2` on `u0`.`id` = `u2`.`user_id` left join `app` as `a1` on `u2`.`app_id` = `a1`.`id` left join `user_apps` as `u3` on `u0`.`id` = `u3`.`user_id` where `u3`.`app_id` = 1');
  });

  test('select-in strategy: find by many-to-many relation IDs (PopulateHint.INFER)', async () => {
    const findPromise = orm.em.findOne(User, { apps: [1, 2, 3] }, { populate: ['apps'], strategy: LoadStrategy.SELECT_IN, populateWhere: PopulateHint.INFER });
    await expect(findPromise).resolves.toBeInstanceOf(User);
    expect(log.mock.calls[0][0]).toMatch('select `u0`.* from `user` as `u0` left join `user_apps` as `u1` on `u0`.`id` = `u1`.`user_id` where `u1`.`app_id` in (1, 2, 3) limit 1');
    expect(log.mock.calls[1][0]).toMatch('select `a1`.*, `u0`.`app_id` as `fk__app_id`, `u0`.`user_id` as `fk__user_id` from `user_apps` as `u0` inner join `app` as `a1` on `u0`.`app_id` = `a1`.`id` where `a1`.`id` in (1, 2, 3) and `u0`.`user_id` in (123)');
  });

  test('joined strategy: find by many-to-many relation IDs (PopulateHint.INFER)', async () => {
    const findPromise = orm.em.findOne(User, { apps: [1, 2, 3] }, { populate: ['apps'], strategy: LoadStrategy.JOINED, populateWhere: PopulateHint.INFER });
    await expect(findPromise).resolves.toBeInstanceOf(User);
    expect(log.mock.calls[0][0]).toMatch('select `u0`.*, `a1`.`id` as `a1__id`, `a1`.`name` as `a1__name` from `user` as `u0` left join `user_apps` as `u2` on `u0`.`id` = `u2`.`user_id` and `u2`.`app_id` in (1, 2, 3) left join `app` as `a1` on `u2`.`app_id` = `a1`.`id` where `u2`.`app_id` in (1, 2, 3)');
  });

  test('select-in strategy: find by many-to-many relation IDs', async () => {
    const findPromise = orm.em.findOne(User, { apps: [1, 2, 3] }, { populate: ['apps'], strategy: LoadStrategy.SELECT_IN });
    await expect(findPromise).resolves.toBeInstanceOf(User);
    expect(log.mock.calls[0][0]).toMatch('select `u0`.* from `user` as `u0` left join `user_apps` as `u1` on `u0`.`id` = `u1`.`user_id` where `u1`.`app_id` in (1, 2, 3) limit 1');
    expect(log.mock.calls[1][0]).toMatch('select `a1`.*, `u0`.`app_id` as `fk__app_id`, `u0`.`user_id` as `fk__user_id` from `user_apps` as `u0` inner join `app` as `a1` on `u0`.`app_id` = `a1`.`id` where `u0`.`user_id` in (123)');
  });

  test('joined strategy: find by many-to-many relation IDs', async () => {
    const findPromise = orm.em.findOne(User, { apps: [1, 2, 3] }, { populate: ['apps'], strategy: LoadStrategy.JOINED });
    await expect(findPromise).resolves.toBeInstanceOf(User);
    expect(log.mock.calls[0][0]).toMatch('select `u0`.*, `a1`.`id` as `a1__id`, `a1`.`name` as `a1__name` from `user` as `u0` left join `user_apps` as `u2` on `u0`.`id` = `u2`.`user_id` left join `app` as `a1` on `u2`.`app_id` = `a1`.`id` left join `user_apps` as `u3` on `u0`.`id` = `u3`.`user_id` where `u3`.`app_id` in (1, 2, 3)');
  });

});
