import { defineEntity, MikroORM, p, raw, Utils, ValidationError } from '@mikro-orm/sql';
import { PLATFORMS } from '../../bootstrap.js';

const User = defineEntity({
  name: 'UpsertErrorUser',
  properties: {
    id: p.integer().primary().autoincrement(),
    email: p.string().unique(),
    code: p.string().unique(),
    name: p.string(),
  },
});

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { port: 3308 },
};

describe.each(Utils.keys(options))('upserted row that cannot be reloaded [%s]', type => {
  let orm: MikroORM;
  const hint = 'pass `onConflictFields` as an array of property names instead';

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: 'mikro_orm_test_upsert_row_error',
      driver: PLATFORMS[type] as any,
      ...options[type],
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
    await orm.em.fork().insert(User, { email: 'a@x', code: 'a', name: 'old' });
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test.each(['upsert', 'upsertMany'] as const)(
    'em.%s() with a raw conflict target hints at the array form',
    async method => {
      const em = orm.em.fork();
      const data = { email: 'a@x', code: 'a', name: 'new' };
      const upsertOptions = { onConflictFields: raw('(code)'), onConflictAction: 'ignore' } as const;
      const error = await (
        method === 'upsert' ? em.upsert(User, data, upsertOptions) : em.upsertMany(User, [data], upsertOptions)
      ).then(
        () => null,
        (e: Error) => e,
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error!.message).toMatch(/^Cannot find the upserted UpsertErrorUser row for condition /);
      expect(error!.message).toContain(hint);
      expect(await orm.em.fork().find(User, {})).toMatchObject([{ code: 'a', name: 'old' }]);
    },
  );

  // only `insert ignore` suppresses a conflict on a unique key outside of the conflict target
  test.skipIf(type !== 'mysql')(
    'em.upsert() with an array conflict target keeps the message without the hint',
    async () => {
      const error = await orm.em
        .fork()
        .upsert(
          User,
          { email: 'a@x', code: 'b', name: 'new' },
          { onConflictFields: ['code'], onConflictAction: 'ignore' },
        )
        .then(
          () => null,
          (e: Error) => e,
        );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error!.message).toBe('Cannot find the upserted UpsertErrorUser row for condition {"code":"b"}');
    },
  );
});
