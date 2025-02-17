import { Entity, JsonType, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/mysql';
import { mockLogger } from '../helpers.js';

type Setup = {
  limits?: boolean;
  fallbackFees?: boolean;
};

@Entity()
class Contract {

  @PrimaryKey()
  id!: number;

  @Property()
  title!: string;

  @Property({ type: JsonType, nullable: true })
  setup: Setup | null = null;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Contract],
    dbName: `mikro_orm_test_4078`,
    port: 3308,
  });

  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('4078', async () => {
  await orm.em.insert(Contract, {
    id: 1,
    title: 't',
    setup: {
      limits: true,
      fallbackFees: false,
    },
  });
  orm.em.clear();
  await orm.em.findOneOrFail(Contract, 1);
  const mock = mockLogger(orm);
  await orm.em.flush();
  expect(mock).not.toHaveBeenCalled();
});
