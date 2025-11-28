import { MikroORM, EntityData } from '@mikro-orm/sqlite';

import { Entity, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class UserConstructorWithDefault {

  @PrimaryKey()
  readonly id!: bigint;

  constructor(data: EntityData<UserConstructorWithDefault> = {}) {
    Object.assign(this, data);
  }

}

@Entity()
class UserConstructorWithoutDefault {

  @PrimaryKey()
  readonly id!: bigint;

  constructor(data?: EntityData<UserConstructorWithoutDefault>) {
    Object.assign(this, data ?? {});
  }

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [UserConstructorWithoutDefault, UserConstructorWithDefault],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.schema.dropSchema();
  await orm.close(true);
});

test('correctly discover constructorParams', async () => {
  expect(orm.em.getMetadata(UserConstructorWithoutDefault).constructorParams).toEqual(['data']);
  expect(orm.em.getMetadata(UserConstructorWithDefault).constructorParams).toEqual(['data']);
});
