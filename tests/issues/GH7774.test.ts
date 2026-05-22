import { defineEntity, MikroORM, p } from '@mikro-orm/postgresql';

const UserV1Schema = defineEntity({
  name: 'User',
  tableName: 'gh_7774_user',
  properties: {
    id: p.integer().primary().autoincrement(),
    flag: p.boolean().default(true),
  },
});

class UserV1 extends UserV1Schema.class {}
UserV1Schema.setClass(UserV1);

const UserV2Schema = defineEntity({
  name: 'User',
  tableName: 'gh_7774_user',
  properties: {
    id: p.integer().primary().autoincrement(),
    flag: p.boolean(),
  },
});

class UserV2 extends UserV2Schema.class {}
UserV2Schema.setClass(UserV2);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_gh_7774',
    entities: [UserV1],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('removing boolean default is detected by schema diff (GH #7774)', async () => {
  orm.discoverEntity(UserV2, UserV1);

  const diff = await orm.schema.getUpdateSchemaSQL({ wrap: false });
  expect(diff).toContain('alter table "gh_7774_user" alter column "flag" drop default');

  await expect(orm.schema.execute(diff)).resolves.toBeUndefined();
});
