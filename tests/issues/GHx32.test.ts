import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

const ClientSettingsSchema = defineEntity({
  name: 'ClientSetting',
  tableName: 'ClientSettings',
  properties: {
    id: p.integer().primary(),
    storeAlias: p.string().length(80),
    isAutoDelistUnusedProductsEnabled: p.boolean().default(false),
    client: () => p.oneToOne(Client).owner().deleteRule('cascade'),
  },
});

export class ClientSettings extends ClientSettingsSchema.class {}
ClientSettingsSchema.setClass(ClientSettings);

const ClientSchema = defineEntity({
  name: 'Client',
  tableName: 'Clients',
  properties: {
    id: p.integer().primary(),
    name: p.string().length(80),
    settings: () =>
      p
        .oneToOne(ClientSettings)
        .mappedBy(settings => settings.client)
        .nullable(),
  },
});

export class Client extends ClientSchema.class {}
ClientSchema.setClass(Client);

describe('onCreate', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      entities: [Client, ClientSettings],
      serialization: { forceObject: true },
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  it('should create a client', async () => {
    const client = orm.em.create(Client, {
      name: 'Test Client',
    });
    orm.em.create(ClientSettings, {
      storeAlias: 'test-store',
      client,
    });

    await orm.em.flush();

    expect(client.id).toBeDefined();
    expect(client.settings).not.toBeNull();
  });
});
