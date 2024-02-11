import { BigIntType, EntitySchema, MikroORM } from '@mikro-orm/sqlite';

export class UserEntity {

  id!: string;

}

export const UserEntitySchema = new EntitySchema({
  class: UserEntity,
  tableName: 'user',
  properties: {
    id: { primary: true, type: new BigIntType('string') },
  },
});

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [UserEntitySchema],
    dbName: ':memory:',
    ensureDatabase: { create: true },
  });
});

afterAll(() => orm.close());

test('lazy em.populate on m:n', async () => {
  expect(orm.getMetadata(UserEntity).properties.id).toMatchObject({ runtimeType: 'string' });

  const a = orm.em.create(UserEntity, {});
  await orm.em.flush();
  expect(a.id).toBe('1');
  orm.em.clear();

  const user = await orm.em.findOneOrFail(UserEntity, { id: '1' });
  expect(user.id).toBe('1');
});
