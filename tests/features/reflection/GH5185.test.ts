import { Entity, Enum, Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

enum OrderState {
  NEW = 'new',
  IN_PROGRESS = 'inProgress',
  CLOSED = 'closed',
}

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;

  @Enum({ items: () => OrderState })
  state: Opt<OrderState> = OrderState.NEW;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
    metadataProvider: TsMorphMetadataProvider,
    metadataCache: { enabled: false },
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('#5185', async () => {
  orm.em.create(User, { username: 'u' });
  await orm.em.flush();
  orm.em.clear();
  const u1 = await orm.em.fork().find(User, {});
  expect(u1).toHaveLength(1);
  const u2 = await orm.em.fork().qb(User).getResult();
  expect(u2).toHaveLength(1);
});
