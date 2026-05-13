// GH #7712 - schema callbacks should expose nested column names for embedded properties
import { defineEntity, MikroORM, p, quote, raw } from '@mikro-orm/sqlite';

const Address = defineEntity({
  name: 'Address7712',
  embeddable: true,
  properties: {
    street: p.string(),
    city: p.string(),
  },
});

const Profile = defineEntity({
  name: 'Profile7712',
  embeddable: true,
  properties: p => ({
    nickname: p.string(),
    address: p.embedded(Address),
  }),
});

const User = defineEntity({
  name: 'User7712',
  properties: p => ({
    id: p.integer().primary(),
    name: p.string(),
    address: p.embedded(Address),
    profile: p.embedded(Profile).prefix('profile_'),
  }),
  checks: [
    {
      name: 'user7712_address_city_check',
      expression: columns => quote`length(${columns.address.city}) > 1`,
    },
    {
      name: 'user7712_profile_addr_street_check',
      expression: columns => quote`length(${columns.profile.address.street}) > 0`,
    },
    {
      // legacy ${columns.embedded} access still resolves to the embedded column prefix
      name: 'user7712_address_prefix_check',
      expression: columns => raw(`?? is not null`, [`${columns.address}_street`]),
    },
  ],
});

test('check callback receives nested column mapping for embedded properties', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Address, Profile, User],
  });

  const sql = await orm.schema.getCreateSchemaSQL({ wrap: false });
  expect(sql).toContain('constraint `user7712_address_city_check` check (length(`address_city`) > 1)');
  expect(sql).toContain('constraint `user7712_profile_addr_street_check` check (length(`profile_address_street`) > 0)');
  expect(sql).toContain('constraint `user7712_address_prefix_check` check (`address_street` is not null)');

  await orm.close();
});
