import {MikroORM} from '@mikro-orm/core';
import {PostgreSqlDriver} from '@mikro-orm/postgresql';
import {initORMPostgreSql, resetDatabase, sleep} from './utils';
import {Sex, User} from '../src/mikro-orm/entities/User';
import {Event} from '../src/mikro-orm/entities/Event';
import {EntityDataLoader} from '../src/dataloader/EntityDataLoader';

describe('Find', () => {
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

  it('should fetch without conditions', async () => {
    const res = await orm.em.find(User, {});
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(res).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    const res = await orm.em.find(User, {});
    const resDataloader = await dataloader.find(orm.em.getRepository(User), {});
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(resDataloader).toBeDefined();
    expect(resDataloader.length).toBeGreaterThan(0);
    expect(JSON.stringify(resDataloader)).toBe(JSON.stringify(res));
  });

  it('should fetch with a single condition', async () => {
    const res = await orm.em.find(User, {sex: Sex.MALE});
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(res).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    const res = await orm.em.find(User, {sex: Sex.MALE});
    const resDataloader = await dataloader.find(orm.em.getRepository(User), {
      sex: Sex.MALE,
    });
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(resDataloader).toBeDefined();
    expect(resDataloader.length).toBeGreaterThan(0);
    expect(JSON.stringify(resDataloader)).toBe(JSON.stringify(res));
  });

  const fiveUserIds = [1, 3, 5, 7, 9];

  it('should fetch elements in array', async () => {
    const res = await orm.em.find(User, {id: fiveUserIds});
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(res).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    const res = await orm.em.find(User, fiveUserIds);
    const resDataloader = await dataloader.find(orm.em.getRepository(User), {
      id: fiveUserIds,
    });
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(resDataloader).toBeDefined();
    expect(resDataloader.length).toBeGreaterThan(0);
    expect(JSON.stringify(resDataloader)).toBe(JSON.stringify(res));
  });

  const fEsc = {site: 1, category: 1};

  it('should fetch with multiple conditions', async () => {
    const res = await orm.em.find(Event, fEsc);
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(res).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    const res = await orm.em.find(Event, fEsc);
    const resDataloader = await dataloader.find(
      orm.em.getRepository(Event),
      fEsc
    );
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(resDataloader).toBeDefined();
    expect(resDataloader.length).toBeGreaterThan(0);
    expect(JSON.stringify(resDataloader)).toBe(JSON.stringify(res));
  });

  const fEscc = {site: 1, category: 1, creator: [2, 6]};

  it('should fetch elements in array matching multiple condition', async () => {
    const res = await orm.em.find(Event, fEscc);
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(res).toMatchSnapshot();
  });

  it('should return the same entities with EntityDataLoader', async () => {
    const res = await orm.em.find(Event, fEscc);
    const resDataloader = await dataloader.find(
      orm.em.getRepository(Event),
      fEscc
    );
    expect(res).toBeDefined();
    expect(res.length).toBeGreaterThan(0);
    expect(resDataloader).toBeDefined();
    expect(resDataloader.length).toBeGreaterThan(0);
    expect(JSON.stringify(resDataloader)).toBe(JSON.stringify(res));
  });

  it('even when queried separately in the same event loop', async () => {
    const res = await Promise.all([
      orm.em.find(Event, {id: [1, 2]}),
      orm.em.find(Event, {id: 3}),
      orm.em.find(Event, {id: 4}),
      orm.em.find(Event, {id: 5}),
      orm.em.find(Event, {id: 6}),
      orm.em.find(Event, {id: 7}),
      orm.em.find(Event, {id: 8}),
      orm.em.find(Event, {id: 9}),
      orm.em.find(Event, {id: 10}),
      orm.em.find(Event, {id: 11}),
      orm.em.find(Event, {id: 12}),
      orm.em.find(Event, {id: 13}),
      orm.em.find(Event, {id: 14}),
      orm.em.find(Event, {id: 15}),
      orm.em.find(Event, {creator: [1, 2]}),
      orm.em.find(Event, {creator: 3}),
      orm.em.find(Event, {creator: 4}),
      orm.em.find(Event, {creator: 5}),
      orm.em.find(Event, {creator: 6}),
      orm.em.find(Event, {creator: 7}),
      orm.em.find(Event, {creator: 8}),
      orm.em.find(Event, {creator: 9}),
      orm.em.find(Event, {site: 1}),
      orm.em.find(Event, {site: 2}),
      orm.em.find(Event, {site: 1, category: 1}),
    ]);
    const resJSON = res.map(el => ({
      data: JSON.stringify(el),
      length: el.length,
    }));
    resJSON.forEach(({data, length}) => {
      expect(data).toBeDefined();
      expect(length).toBeGreaterThanOrEqual(0);
      expect(data).toMatchSnapshot();
    });

    orm.em.clear();

    const resDataloader = await Promise.all([
      dataloader.find(orm.em.getRepository(Event), {id: [1, 2]}),
      dataloader.find(orm.em.getRepository(Event), {id: 3}),
      dataloader.find(orm.em.getRepository(Event), {id: 4}),
      dataloader.find(orm.em.getRepository(Event), {id: 5}),
      dataloader.find(orm.em.getRepository(Event), {id: 6}),
      dataloader.find(orm.em.getRepository(Event), {id: 7}),
      dataloader.find(orm.em.getRepository(Event), {id: 8}),
      dataloader.find(orm.em.getRepository(Event), {id: 9}),
      dataloader.find(orm.em.getRepository(Event), {id: 10}),
      dataloader.find(orm.em.getRepository(Event), {id: 11}),
      dataloader.find(orm.em.getRepository(Event), {id: 12}),
      dataloader.find(orm.em.getRepository(Event), {id: 13}),
      dataloader.find(orm.em.getRepository(Event), {id: 14}),
      dataloader.find(orm.em.getRepository(Event), {id: 15}),
      dataloader.find(orm.em.getRepository(Event), {creator: [1, 2]}),
      dataloader.find(orm.em.getRepository(Event), {creator: 3}),
      dataloader.find(orm.em.getRepository(Event), {creator: 4}),
      dataloader.find(orm.em.getRepository(Event), {creator: 5}),
      dataloader.find(orm.em.getRepository(Event), {creator: 6}),
      dataloader.find(orm.em.getRepository(Event), {creator: 7}),
      dataloader.find(orm.em.getRepository(Event), {creator: 8}),
      dataloader.find(orm.em.getRepository(Event), {creator: 9}),
      dataloader.find(orm.em.getRepository(Event), {site: 1}),
      dataloader.find(orm.em.getRepository(Event), {site: 2}),
      dataloader.find(orm.em.getRepository(Event), {site: 1, category: 1}),
    ]);
    const flattenReferences = (el: Event[]) =>
      JSON.parse(JSON.stringify(el)).map(
        (
          event: Omit<Event, 'creator' | 'category' | 'site'> & {
            creator: number & {id?: number};
            category: number & {id?: number};
            site: number & {id?: number};
          }
        ) => ({
          ...event,
          creator: event.creator.id ?? event.creator,
          category: event.category.id ?? event.category,
          site: event.site.id ?? event.site,
        })
      );
    resDataloader
      .map(el => flattenReferences(el))
      .forEach((el, i) => {
        expect(el).toBeDefined();
        expect(el.length).toBe(resJSON[i].length);
        expect(JSON.stringify(el)).toBe(resJSON[i].data);
      });
  });

  it('should be faster with EntityDataLoader', async () => {
    const start = new Date();
    await Promise.all([
      orm.em.find(Event, {id: [1, 2]}),
      orm.em.find(Event, {id: 3}),
      orm.em.find(Event, {id: 4}),
      orm.em.find(Event, {id: 5}),
      orm.em.find(Event, {id: 6}),
      orm.em.find(Event, {id: 7}),
      orm.em.find(Event, {id: 8}),
      orm.em.find(Event, {id: 9}),
      orm.em.find(Event, {id: 10}),
      orm.em.find(Event, {id: 11}),
      orm.em.find(Event, {id: 12}),
      orm.em.find(Event, {id: 13}),
      orm.em.find(Event, {id: 14}),
      orm.em.find(Event, {id: 15}),
      orm.em.find(Event, {creator: [1, 2]}),
      orm.em.find(Event, {creator: 3}),
      orm.em.find(Event, {creator: 4}),
      orm.em.find(Event, {creator: 5}),
      orm.em.find(Event, {creator: 6}),
      orm.em.find(Event, {creator: 7}),
      orm.em.find(Event, {creator: 8}),
      orm.em.find(Event, {creator: 9}),
      orm.em.find(Event, {site: 1}),
      orm.em.find(Event, {site: 2}),
      orm.em.find(Event, {site: 1, category: 1}),
    ]);
    const end = new Date();
    const diff = end.getTime() - start.getTime();

    orm.em.clear();

    const startDataloader = new Date();
    await Promise.all([
      dataloader.find(orm.em.getRepository(Event), {id: [1, 2]}),
      dataloader.find(orm.em.getRepository(Event), {id: 3}),
      dataloader.find(orm.em.getRepository(Event), {id: 4}),
      dataloader.find(orm.em.getRepository(Event), {id: 5}),
      dataloader.find(orm.em.getRepository(Event), {id: 6}),
      dataloader.find(orm.em.getRepository(Event), {id: 7}),
      dataloader.find(orm.em.getRepository(Event), {id: 8}),
      dataloader.find(orm.em.getRepository(Event), {id: 9}),
      dataloader.find(orm.em.getRepository(Event), {id: 10}),
      dataloader.find(orm.em.getRepository(Event), {id: 11}),
      dataloader.find(orm.em.getRepository(Event), {id: 12}),
      dataloader.find(orm.em.getRepository(Event), {id: 13}),
      dataloader.find(orm.em.getRepository(Event), {id: 14}),
      dataloader.find(orm.em.getRepository(Event), {id: 15}),
      dataloader.find(orm.em.getRepository(Event), {creator: [1, 2]}),
      dataloader.find(orm.em.getRepository(Event), {creator: 3}),
      dataloader.find(orm.em.getRepository(Event), {creator: 4}),
      dataloader.find(orm.em.getRepository(Event), {creator: 5}),
      dataloader.find(orm.em.getRepository(Event), {creator: 6}),
      dataloader.find(orm.em.getRepository(Event), {creator: 7}),
      dataloader.find(orm.em.getRepository(Event), {creator: 8}),
      dataloader.find(orm.em.getRepository(Event), {creator: 9}),
      dataloader.find(orm.em.getRepository(Event), {site: 1}),
      dataloader.find(orm.em.getRepository(Event), {site: 2}),
      dataloader.find(orm.em.getRepository(Event), {site: 1, category: 1}),
    ]);
    const endDataloader = new Date();
    const diffDataloader = endDataloader.getTime() - startDataloader.getTime();
    console.log(`W/o dataloader: ${diff} ms`);
    console.log(`W/ dataloader: ${diffDataloader} ms`);
    expect(diffDataloader).toBeLessThanOrEqual(diff);
  });

  it('should be able to deal with different entities in the same event loop', async () => {
    const res = await Promise.all<User[] | Event[]>([
      orm.em.find(Event, {id: [1, 2]}),
      orm.em.find(Event, {id: 3}),
      orm.em.find(Event, {id: 4}),
      orm.em.find(Event, {id: 5}),
      orm.em.find(Event, {id: 6}),
      orm.em.find(Event, {id: 7}),
      orm.em.find(Event, {id: 8}),
      orm.em.find(Event, {id: 9}),
      orm.em.find(Event, {creator: [1, 2]}),
      orm.em.find(Event, {creator: 3}),
      orm.em.find(Event, {creator: 4}),
      orm.em.find(Event, {creator: 5}),
      orm.em.find(Event, {creator: 6}),
      orm.em.find(Event, {creator: 7}),
      orm.em.find(Event, {creator: 8}),
      orm.em.find(Event, {creator: 9}),
      orm.em.find(User, {id: [1, 2]}),
      orm.em.find(User, {id: 3}),
      orm.em.find(User, {id: 4}),
      orm.em.find(User, {id: 5}),
      orm.em.find(User, {id: 6}),
      orm.em.find(User, {id: 7}),
      orm.em.find(User, {id: 8}),
      orm.em.find(User, {id: 9}),
      orm.em.find(User, {sex: Sex.MALE}),
    ]);
    const resJSON = res.map(el => ({
      data: JSON.stringify(el),
      length: el.length,
    }));
    resJSON.forEach(({data, length}) => {
      expect(data).toBeDefined();
      expect(length).toBeGreaterThanOrEqual(0);
      expect(data).toMatchSnapshot();
    });

    orm.em.clear();

    const resDataloader = await Promise.all<User[] | Event[]>([
      dataloader.find(orm.em.getRepository(Event), {id: [1, 2]}),
      dataloader.find(orm.em.getRepository(Event), {id: 3}),
      dataloader.find(orm.em.getRepository(Event), {id: 4}),
      dataloader.find(orm.em.getRepository(Event), {id: 5}),
      dataloader.find(orm.em.getRepository(Event), {id: 6}),
      dataloader.find(orm.em.getRepository(Event), {id: 7}),
      dataloader.find(orm.em.getRepository(Event), {id: 8}),
      dataloader.find(orm.em.getRepository(Event), {id: 9}),
      dataloader.find(orm.em.getRepository(Event), {creator: [1, 2]}),
      dataloader.find(orm.em.getRepository(Event), {creator: 3}),
      dataloader.find(orm.em.getRepository(Event), {creator: 4}),
      dataloader.find(orm.em.getRepository(Event), {creator: 5}),
      dataloader.find(orm.em.getRepository(Event), {creator: 6}),
      dataloader.find(orm.em.getRepository(Event), {creator: 7}),
      dataloader.find(orm.em.getRepository(Event), {creator: 8}),
      dataloader.find(orm.em.getRepository(Event), {creator: 9}),
      dataloader.find(orm.em.getRepository(User), {id: [1, 2]}),
      dataloader.find(orm.em.getRepository(User), {id: 3}),
      dataloader.find(orm.em.getRepository(User), {id: 4}),
      dataloader.find(orm.em.getRepository(User), {id: 5}),
      dataloader.find(orm.em.getRepository(User), {id: 6}),
      dataloader.find(orm.em.getRepository(User), {id: 7}),
      dataloader.find(orm.em.getRepository(User), {id: 8}),
      dataloader.find(orm.em.getRepository(User), {id: 9}),
      dataloader.find(orm.em.getRepository(User), {sex: Sex.MALE}),
    ]);
    const isUser = (
      userOrEvent:
        | User
        | (Omit<Event, 'creator'> & {
            creator: number & {id?: number};
          })
    ): userOrEvent is User => (userOrEvent as User).sex != null;
    const flattenReferences = (el: Event[] | User[]) =>
      JSON.parse(JSON.stringify(el)).map(
        (
          userOrEvent:
            | User
            | (Omit<Event, 'creator'> & {
                creator: number & {id?: number};
              })
        ) =>
          isUser(userOrEvent)
            ? userOrEvent
            : {
                ...userOrEvent,
                creator: userOrEvent.creator.id ?? userOrEvent.creator,
              }
      );
    resDataloader
      .map(el => flattenReferences(el))
      .forEach((el, i) => {
        expect(el).toBeDefined();
        expect(el.length).toBe(resJSON[i].length);
        expect(JSON.stringify(el)).toBe(resJSON[i].data);
      });
  });

  it('should be faster with EntityDataLoader', async () => {
    const start = new Date();
    await Promise.all<User[] | Event[]>([
      orm.em.find(Event, {id: [1, 2]}),
      orm.em.find(Event, {id: 3}),
      orm.em.find(Event, {id: 4}),
      orm.em.find(Event, {id: 5}),
      orm.em.find(Event, {id: 6}),
      orm.em.find(Event, {id: 7}),
      orm.em.find(Event, {id: 8}),
      orm.em.find(Event, {id: 9}),
      orm.em.find(Event, {creator: [1, 2]}),
      orm.em.find(Event, {creator: 3}),
      orm.em.find(Event, {creator: 4}),
      orm.em.find(Event, {creator: 5}),
      orm.em.find(Event, {creator: 6}),
      orm.em.find(Event, {creator: 7}),
      orm.em.find(Event, {creator: 8}),
      orm.em.find(Event, {creator: 9}),
      orm.em.find(User, {id: [1, 2]}),
      orm.em.find(User, {id: 3}),
      orm.em.find(User, {id: 4}),
      orm.em.find(User, {id: 5}),
      orm.em.find(User, {id: 6}),
      orm.em.find(User, {id: 7}),
      orm.em.find(User, {id: 8}),
      orm.em.find(User, {id: 9}),
      orm.em.find(User, {sex: Sex.MALE}),
    ]);
    const end = new Date();
    const diff = end.getTime() - start.getTime();

    orm.em.clear();

    const startDataloader = new Date();
    await Promise.all<User[] | Event[]>([
      dataloader.find(orm.em.getRepository(Event), {id: [1, 2]}),
      dataloader.find(orm.em.getRepository(Event), {id: 3}),
      dataloader.find(orm.em.getRepository(Event), {id: 4}),
      dataloader.find(orm.em.getRepository(Event), {id: 5}),
      dataloader.find(orm.em.getRepository(Event), {id: 6}),
      dataloader.find(orm.em.getRepository(Event), {id: 7}),
      dataloader.find(orm.em.getRepository(Event), {id: 8}),
      dataloader.find(orm.em.getRepository(Event), {id: 9}),
      dataloader.find(orm.em.getRepository(Event), {creator: [1, 2]}),
      dataloader.find(orm.em.getRepository(Event), {creator: 3}),
      dataloader.find(orm.em.getRepository(Event), {creator: 4}),
      dataloader.find(orm.em.getRepository(Event), {creator: 5}),
      dataloader.find(orm.em.getRepository(Event), {creator: 6}),
      dataloader.find(orm.em.getRepository(Event), {creator: 7}),
      dataloader.find(orm.em.getRepository(Event), {creator: 8}),
      dataloader.find(orm.em.getRepository(Event), {creator: 9}),
      dataloader.find(orm.em.getRepository(User), {id: [1, 2]}),
      dataloader.find(orm.em.getRepository(User), {id: 3}),
      dataloader.find(orm.em.getRepository(User), {id: 4}),
      dataloader.find(orm.em.getRepository(User), {id: 5}),
      dataloader.find(orm.em.getRepository(User), {id: 6}),
      dataloader.find(orm.em.getRepository(User), {id: 7}),
      dataloader.find(orm.em.getRepository(User), {id: 8}),
      dataloader.find(orm.em.getRepository(User), {id: 9}),
      dataloader.find(orm.em.getRepository(User), {sex: Sex.MALE}),
    ]);
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
