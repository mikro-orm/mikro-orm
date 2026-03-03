import { Opt } from '@mikro-orm/core';
import { Entity, Enum, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

enum OrderState {
  NEW = 'new',
  IN_PROGRESS = 'inProgress',
  CLOSED = 'closed',
}

type Nullable<T> = T | null;

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;

  @Property({ columnType: 'varchar' })
  test!: Nullable<string>;

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
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('#5185 and #5221', async () => {
  orm.em.create(User, { username: 'u', test: '123' });
  await orm.em.flush();
  orm.em.clear();
  const u1 = await orm.em.fork().find(User, {});
  expect(u1).toHaveLength(1);
  const [u2, total] = await orm.em.fork().qb(User).getResultAndCount();
  expect(u2).toHaveLength(1);
  expect(total).toBe(1);
});
