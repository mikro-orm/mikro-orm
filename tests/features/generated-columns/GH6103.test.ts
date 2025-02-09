import { Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';
import { mockLogger } from '../../helpers.js';

@Entity()
class ClientEntity {

  @PrimaryKey({ columnType: 'uuid' })
  id: string = v4();

}

@Entity()
class ActionEntity {

  @PrimaryKey({ generated: 'identity' })
  id!: bigint;

  @Property()
  actionName!: string;

}

@Entity()
class ClientActionEntity {

  @PrimaryKey({ generated: 'identity', unique: true })
  id!: bigint;

  @ManyToOne({ entity: () => ClientEntity })
  clientEntity!: ClientEntity;

  @ManyToOne({ entity: () => ActionEntity })
  actionEntity!: ActionEntity;

  @Property()
  actionEnabled: boolean = false;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [ClientEntity, ActionEntity, ClientActionEntity],
    schemaGenerator: {
      createForeignKeyConstraints: false,
    },
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('6103', async () => {
  const mock = mockLogger(orm);
  await orm.em.nativeUpdate(
    ClientActionEntity,
    { clientEntity: { id: 'eda4dd9d-53c6-4b1e-a177-97c0c9366873' }, actionEntity: { actionName: 'actionName' } },
    { actionEnabled: true },
  );
  expect(mock.mock.calls[0][0]).toMatch(`update "client_action_entity" set "action_enabled" = true where "id" in (select "c0"."id" from (select distinct "c0"."id" from "client_action_entity" as "c0" left join "action_entity" as "a1" on "c0"."action_entity_id" = "a1"."id" where "c0"."client_entity_id" = 'eda4dd9d-53c6-4b1e-a177-97c0c9366873' and "a1"."action_name" = 'actionName') as "c0")`);
});
