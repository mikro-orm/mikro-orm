import {MikroORM} from '@mikro-orm/core';
import {PostgreSqlDriver} from '@mikro-orm/postgresql';
import {initORMPostgreSql, resetDatabase, sleep, Optional} from './utils';
import {User} from '../src/mikro-orm/entities/User';
import {Event} from '../src/mikro-orm/entities/Event';
import {EntityDataLoader} from '../src/dataloader/EntityDataLoader';

describe('LoadItems', () => {
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

  it('should load a collection', async () => {
    const event = await orm.em.findOneOrFail(Event, {id: 5});
    const res = await event.partecipants.loadItems();
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(res).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    let event = await orm.em.findOneOrFail(Event, {id: 5});
    const res = JSON.stringify(await event.partecipants.loadItems());

    orm.em.clear();

    event = await orm.em.findOneOrFail(Event, {id: 5});
    const resDataloader: Optional<User, 'partecipatedEvents'>[] =
      await dataloader.load(event.partecipants);
    resDataloader.forEach(el => delete el.partecipatedEvents);
    expect(resDataloader).toBeDefined();
    expect(resDataloader.length).toBeGreaterThan(0);
    expect(JSON.stringify(resDataloader)).toBe(res);
  });

  const tenEventIds = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

  it('even when queried separately in the same event loop', async () => {
    let events = await orm.em.find(Event, {id: tenEventIds});
    let res: User[][] | string = await Promise.all(
      events.map(event => event.partecipants.loadItems())
    );
    expect(res).toMatchSnapshot();
    res = JSON.stringify(res);

    orm.em.clear();

    events = await orm.em.find(Event, {id: tenEventIds});
    const resDataloader: Optional<User, 'partecipatedEvents'>[][] =
      await Promise.all(
        events.map(event => dataloader.load(event.partecipants))
      );
    resDataloader.forEach(users => {
      users.sort((a, b) => a.id - b.id);
      users.forEach(el => delete el.partecipatedEvents);
    });
    expect(resDataloader).toBeDefined();
    expect(JSON.stringify(resDataloader)).toBe(res);
  });

  it('should be faster with EntityDataLoader', async () => {
    let events = await orm.em.find(Event, {id: tenEventIds});
    const start = new Date();
    await Promise.all(events.map(event => event.partecipants.loadItems()));
    const end = new Date();
    const diff = end.getTime() - start.getTime();

    orm.em.clear();

    events = await orm.em.find(Event, {id: tenEventIds});
    const startDataloader = new Date();
    await Promise.all(events.map(event => dataloader.load(event.partecipants)));
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
