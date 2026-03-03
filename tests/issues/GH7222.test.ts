/**
 * Reproduction for GH issue #7222
 * v7 defineEntity with `extends: BaseEntity` causes EntityDTO<BaseEntity> type
 *
 * When using `extends: BaseEntity` in defineEntity, calling `.toObject()` on
 * the entity returns `EntityDTO<BaseEntity>` instead of the proper entity DTO type.
 * Using `wrap(user).toObject()` works correctly as a workaround.
 */
import { defineEntity, BaseEntity, p, wrap, MikroORM, EntityDTO, InferEntity } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

const User = defineEntity({
  name: 'User7222',
  extends: BaseEntity,
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    email: p.string().unique(),
  },
});

type UserEntity = InferEntity<typeof User>;

// Type-level test: verify that BaseEntity methods resolve with the correct entity type
function typeTest(user: UserEntity) {
  const dto = user.toObject();
  const _name: string = dto.name;
  const _email: string = dto.email;

  const pojo = user.toPOJO();
  const _pojoName: string = pojo.name;

  const serialized = user.serialize();
  const _serializedName: string = serialized.name;

  const assigned = user.assign({ name: 'x' });
  const _assignedName: string = assigned.name;
}

describe('GH issue 7222', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test('toObject() should return correct type when using extends: BaseEntity', async () => {
    const user = orm.em.create(User, {
      name: 'Test User',
      email: 'test@example.com',
    });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(User, { email: 'test@example.com' });

    // Runtime: both approaches produce the same result
    const dto1 = found.toObject();
    const dto2 = wrap(found).toObject();

    expect(dto1).toEqual(dto2);
    expect(dto1.name).toBe('Test User');
    expect(dto1.email).toBe('test@example.com');

    // The type-level issue: found.toObject() returns EntityDTO<BaseEntity>
    // which doesn't include `name` or `email` properties.
    // wrap(found).toObject() correctly returns EntityDTO<UserEntity>.
  });
});
