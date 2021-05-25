import {MikroORM} from '@mikro-orm/core';
import {PostgreSqlDriver} from '@mikro-orm/postgresql';
import {initORMPostgreSql, resetDatabase, sleep, Optional} from './utils';
import {User} from '../src/mikro-orm/entities/User';
import {Event} from '../src/mikro-orm/entities/Event';
import {EntityDataLoader} from '../src/dataloader/EntityDataLoader';
import {Category} from '../src/mikro-orm/entities/Category';
import {Message} from '../src/mikro-orm/entities/Message';
import {Site} from '../src/mikro-orm/entities/Site';

describe('Load and loadItems', () => {
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

  const tenEventIds = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

  it('should be able to deal with different entities/references/collections in the same event loop', async () => {
    let events = await orm.em.find(Event, {id: tenEventIds});
    let messages = await orm.em.find(Message, {sender: 1});
    const partecipants = await Promise.all(
      events.map(event => event.partecipants.loadItems())
    );
    const categories = await Promise.all(
      events.map(event => event.category.load())
    );
    const sites = await Promise.all(events.map(event => event.site.load()));
    const senders = await Promise.all(
      messages.map(message => message.sender.load())
    );
    const recipients = await Promise.all(
      messages.map(message => message.recipient.load())
    );
    const partecipantsJSON = JSON.stringify(partecipants);
    const categoriesJSON = JSON.stringify(categories);
    const sitesJSON = JSON.stringify(sites);
    const sendersJSON = JSON.stringify(senders);
    const recipientsJSON = JSON.stringify(recipients);
    expect(partecipants).toBeDefined();
    expect(partecipants.length).toBeGreaterThan(0);
    expect(partecipants).toMatchSnapshot();
    expect(categories).toBeDefined();
    expect(categories.length).toBeGreaterThan(0);
    expect(categories).toMatchSnapshot();
    expect(sites).toBeDefined();
    expect(sites.length).toBeGreaterThan(0);
    expect(sites).toMatchSnapshot();
    expect(senders).toBeDefined();
    expect(senders.length).toBeGreaterThan(0);
    expect(senders).toMatchSnapshot();
    expect(recipients).toBeDefined();
    expect(recipients.length).toBeGreaterThan(0);
    expect(recipients).toMatchSnapshot();

    orm.em.clear();

    events = await orm.em.find(Event, {id: tenEventIds});
    messages = await orm.em.find(Message, {sender: 1});
    const resDataloader = await Promise.all<User[] | User | Category | Site>([
      ...events.map(event => dataloader.load(event.partecipants)),
      ...events.map(event => dataloader.load(event.category)),
      ...events.map(event => dataloader.load(event.site)),
      ...messages.map(message => dataloader.load(message.sender)),
      ...messages.map(message => dataloader.load(message.recipient)),
    ]);
    let [i, j] = [0, partecipants.length];
    const partecipantsDataloader = resDataloader.slice(i, j) as Optional<
      User,
      'partecipatedEvents'
    >[][];
    partecipantsDataloader.forEach(users => {
      users.sort((a, b) => a.id - b.id);
      users.forEach(el => delete el.partecipatedEvents);
    });
    expect(partecipantsDataloader).toBeDefined();
    expect(partecipantsDataloader.length).toBe(partecipants.length);
    expect(JSON.stringify(partecipantsDataloader)).toBe(partecipantsJSON);
    [i, j] = [i + partecipants.length, j + categories.length];
    const categoriesDataloader = resDataloader.slice(i, j) as Category[];
    expect(categoriesDataloader).toBeDefined();
    expect(categoriesDataloader.length).toBe(categories.length);
    expect(JSON.stringify(categoriesDataloader)).toBe(categoriesJSON);
    [i, j] = [i + categories.length, j + sites.length];
    const sitesDataloader = resDataloader.slice(i, j) as Site[];
    expect(sitesDataloader).toBeDefined();
    expect(sitesDataloader.length).toBe(sites.length);
    expect(JSON.stringify(sitesDataloader)).toBe(sitesJSON);
    [i, j] = [i + sites.length, j + senders.length];
    const sendersDataloader = resDataloader.slice(i, j) as User[];
    expect(sendersDataloader).toBeDefined();
    expect(sendersDataloader.length).toBe(senders.length);
    expect(JSON.stringify(sendersDataloader)).toBe(sendersJSON);
    [i, j] = [i + senders.length, j + recipients.length];
    const recipientsDataloader = resDataloader.slice(i, j) as User[];
    expect(recipientsDataloader).toBeDefined();
    expect(recipientsDataloader.length).toBe(recipients.length);
    expect(JSON.stringify(recipientsDataloader)).toBe(recipientsJSON);
  });

  it('should be faster with EntityDataLoader', async () => {
    let events = await orm.em.find(Event, {id: tenEventIds});
    let messages = await orm.em.find(Message, {sender: 1});
    const start = new Date();
    await Promise.all<User[] | User | Category | Site>([
      ...events.map(event => event.partecipants.loadItems()),
      ...events.map(event => event.category.load()),
      ...events.map(event => event.site.load()),
      ...messages.map(message => message.sender.load()),
      ...messages.map(message => message.recipient.load()),
    ]);
    const end = new Date();
    const diff = end.getTime() - start.getTime();

    orm.em.clear();

    events = await orm.em.find(Event, {id: tenEventIds});
    messages = await orm.em.find(Message, {sender: 1});
    const startDataloader = new Date();
    await Promise.all<User[] | User | Category | Site>([
      ...events.map(event => dataloader.load(event.partecipants)),
      ...events.map(event => dataloader.load(event.category)),
      ...events.map(event => dataloader.load(event.site)),
      ...messages.map(message => dataloader.load(message.sender)),
      ...messages.map(message => dataloader.load(message.recipient)),
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
