import {MikroORM} from '@mikro-orm/core';
import {PostgreSqlDriver} from '@mikro-orm/postgresql';
import {initORMPostgreSql, resetDatabase, sleep} from './utils';
import {User} from '../src/mikro-orm/entities/User';
import {EntityDataLoader} from '../src/dataloader/EntityDataLoader';

describe('FindOne', () => {
  jest.setTimeout(10e3);
  let orm: MikroORM<PostgreSqlDriver>;
  let dataloader: EntityDataLoader;

  beforeAll(async () => {
    orm = await initORMPostgreSql();
    await resetDatabase(orm);
  });

  beforeEach(async () => {
    orm.em.clear();
    dataloader = new EntityDataLoader(orm.em);
    await sleep(100);
  });

  it('should fetch with a single condition', async () => {
    const res = await orm.em.findOne(User, {id: 9});
    expect(res).toBeDefined();
    expect(res).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    const res = await orm.em.findOne(User, {id: 9});
    const resDataloader = await dataloader.findOne(orm.em.getRepository(User), {
      id: 9,
    });
    expect(res).toBeDefined();
    expect(resDataloader).toBeDefined();
    expect(JSON.stringify(resDataloader)).toBe(JSON.stringify(res));
  });

  const fiveUserIds = [1, 3, 5, 7, 9];

  it('even when queried separately in the same event loop', async () => {
    let res: User[] | string = await Promise.all(
      fiveUserIds.map(id => orm.em.findOneOrFail(User, {id}))
    );
    expect(res).toMatchSnapshot();
    res = JSON.stringify(res);

    orm.em.clear();

    const resDataloader = await Promise.all(
      fiveUserIds.map(id =>
        dataloader.findOneOrFail(orm.em.getRepository(User), {id})
      )
    );
    expect(resDataloader).toBeDefined();
    expect(JSON.stringify(resDataloader)).toBe(res);
  });

  it('should be faster with EntityDataLoader', async () => {
    const start = new Date();
    await Promise.all(fiveUserIds.map(id => orm.em.findOneOrFail(User, {id})));
    const end = new Date();
    const diff = end.getTime() - start.getTime();

    orm.em.clear();

    const startDataloader = new Date();
    await Promise.all(
      fiveUserIds.map(id =>
        dataloader.findOneOrFail(orm.em.getRepository(User), {id})
      )
    );
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThanOrEqual(diff);
  });

  afterEach(async () => {});

  afterAll(async () => {
    orm.close(true);
    await sleep(100);
  });

  afterEach(async () => {});

  afterAll(async () => {
    orm.close(true);
    await sleep(100);
  });
});
