import {
  Entity,
  PrimaryKey,
  FlushEventArgs,
  JsonType,
  Property,
} from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class Example {

  @PrimaryKey()
  id!: number;

  @Property({ type: JsonType })
  metadata: Record<string, unknown> = {};

}

test(`GH issue 3757`, async () => {
  let invoked = false;

  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Example],
    type: 'sqlite',
    subscribers: [{
      afterFlush(args: FlushEventArgs) {
        const changes = args.uow.getChangeSets();

        for (const change of changes) {
          if (change.entity instanceof Example && change.originalEntity) {
            expect(typeof change.originalEntity.metadata === 'string').toBe(false);
            expect(change.originalEntity).toMatchObject({ foo: 'bar' });

            invoked = true;
          }
        }
      },
    }],
  });

  await orm.schema.createSchema();

  const example = orm.em.create(Example, { metadata: { foo: 'bar' } });

  await orm.em.flush();

  example.metadata = { bum: 'baz' };

  await orm.em.flush();

  expect(invoked).toBe(true);
});
