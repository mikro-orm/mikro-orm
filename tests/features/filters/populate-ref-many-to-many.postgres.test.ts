import { defineEntity, MikroORM, p, wrap } from '@mikro-orm/postgresql';

enum Platform {
  Web = 'web',
  Mobile = 'mobile',
}

const Permission = defineEntity({
  name: 'Permission',
  properties: {
    id: p.string().primary(),
    platform: p.enum(Platform),
  },
  filters: {
    permissionPlatform: {
      name: 'permissionPlatform',
      default: false,
      cond: args => (args.platforms?.length ? { platform: [...args.platforms] } : {}),
    },
  },
});

const Client = defineEntity({ name: 'Client', properties: { id: p.string().primary() } });
const ClientUser = defineEntity({
  name: 'ClientUser',
  properties: {
    id: p.string().primary(),
    client: () => p.manyToOne(Client),
    permissions: () =>
      p
        .manyToMany(Permission)
        .owner()
        .pivotTable('_Join:ClientUsers:Permissions')
        .joinColumn('client_user_id')
        .inverseJoinColumn('permission_id'),
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [ClientUser], dbName: 'mikro_orm_populate_ref_many_to_many' });
  await orm.schema.refresh();
  orm.em.create(ClientUser, {
    id: 'user',
    client: { id: 'client' },
    permissions: [
      { id: 'web', platform: Platform.Web },
      { id: 'mobile', platform: Platform.Mobile },
    ],
  });
  await orm.em.flush();
  orm.em.create(ClientUser, { id: 'filtered', client: 'client', permissions: ['mobile'] });
  orm.em.create(ClientUser, { id: 'empty', client: 'client', permissions: [] });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => orm?.close(true));

describe.each(['balanced', 'joined', 'select-in'] as const)('%s', strategy => {
  describe.each([true, false])('ref=%s', ref => {
    describe.each(['permissions', 'permissions.id', undefined] as const)('fields=%s', field => {
      test.each([true, false])('filter=%s', async filtered => {
        const owners = [
          { id: 'user', permissions: ['mobile', 'web'] },
          { id: 'filtered', permissions: ['mobile'] },
          { id: 'empty', permissions: [] },
        ];

        for (const { id, permissions } of owners) {
          const em = orm.em.fork();
          const user = await em.getRepository(ClientUser).findOneOrFail(
            { id, client: 'client' },
            {
              fields: field ? [field] : undefined,
              populate: [ref ? 'permissions:ref' : 'permissions'],
              filters: filtered ? { permissionPlatform: { platforms: [Platform.Web] } } : undefined,
              strategy,
            },
          );
          const expected = filtered ? permissions.filter(permission => permission === 'web') : permissions;
          expect(user.permissions.getIdentifiers().sort()).toEqual(expected);
          expect(user.permissions.isInitialized()).toBe(true);
          for (const permission of user.permissions) {
            // Nested fields also infer normal population, even with an explicit :ref hint.
            expect(wrap(permission).isInitialized()).toBe(!ref || field === 'permissions.id');
          }
        }
      });
    });
  });
});
