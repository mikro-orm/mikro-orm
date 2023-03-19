import { Entity, PrimaryKey, Property, SimpleLogger } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { mockLogger } from '../../helpers';

@Entity()
export class GuildEntity {

  @PrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Property({ defaultRaw: 'current_timestamp', index: true })
  created_at: Date = new Date();

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [GuildEntity],
    loggerFactory: options => new SimpleLogger(options),
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH issue 4020', async () => {
  const mock = mockLogger(orm);
  const e = await orm.em.upsert(GuildEntity, {
    id: '1',
    name: 'name',
  });

  expect(e.created_at).toBeInstanceOf(Date);
  expect(mock.mock.calls).toEqual([
    ["[query] insert into `guild_entity` (`id`, `name`) values ('1', 'name') on conflict (`id`) do update set `name` = excluded.`name` returning `created_at`"],
  ]);
});
