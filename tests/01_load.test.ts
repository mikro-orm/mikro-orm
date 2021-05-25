import {MikroORM} from '@mikro-orm/core';
import {PostgreSqlDriver} from '@mikro-orm/postgresql';
import {initORMPostgreSql, resetDatabase, sleep} from './utils';
import {Event} from '../src/mikro-orm/entities/Event';
import {EntityDataLoader} from '../src/dataloader/EntityDataLoader';
import {Category} from '../src/mikro-orm/entities/Category';

describe('Load', () => {
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

  it('should load a reference', async () => {
    const event = await orm.em.findOneOrFail(Event, {id: 5});
    const res = await event.category.load();
    expect(res).toBeDefined();
    expect(res).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    let event = await orm.em.findOneOrFail(Event, {id: 5});
    const res = JSON.stringify(await event.category.load());

    orm.em.clear();

    event = await orm.em.findOneOrFail(Event, {id: 5});
    const resDataloader = await dataloader.load(event.category);
    expect(resDataloader).toBeDefined();
    expect(JSON.stringify(resDataloader)).toBe(res);
  });

  const fiveEentIds = [1, 3, 5, 7, 9];

  it('even when queried separately in the same event loop', async () => {
    let events = await orm.em.find(Event, {id: fiveEentIds});
    let res: Category[] | string = await Promise.all(
      events.map(event => event.category.load())
    );
    expect(res).toMatchSnapshot();
    res = JSON.stringify(res);

    orm.em.clear();

    events = await orm.em.find(Event, {id: fiveEentIds});
    const resDataloader = await Promise.all(
      events.map(event => dataloader.load(event.category))
    );
    expect(resDataloader).toBeDefined();
    expect(JSON.stringify(resDataloader)).toBe(res);
  });

  it('should be faster with EntityDataLoader', async () => {
    let events = await orm.em.find(Event, {id: fiveEentIds});
    const start = new Date();
    await Promise.all(events.map(event => event.category.load()));
    const end = new Date();
    const diff = end.getTime() - start.getTime();

    orm.em.clear();

    events = await orm.em.find(Event, {id: fiveEentIds});
    const startDataloader = new Date();
    await Promise.all(events.map(event => dataloader.load(event.category)));
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
});
