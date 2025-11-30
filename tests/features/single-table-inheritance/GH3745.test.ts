import { MikroORM } from '@mikro-orm/sqlite';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
abstract class BaseMikro {

  @PrimaryKey({ type: 'bigint' })
  id!: string;

}

@Entity({ discriminatorColumn: 'type', abstract: true })
abstract class LevelOne extends BaseMikro {

  @Property({ type: 'int' })
  type!: number;

}

@Entity({ abstract: true })
abstract class LevelTwo extends LevelOne {

  @Property()
  name!: string;

}

@Entity({ discriminatorValue: 1 })
class LevelThree extends LevelTwo {

  @Property()
  foo!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [BaseMikro, LevelOne, LevelTwo, LevelThree],
  });
  await orm.schema.create();
});

afterAll(async () => {
  await orm.close(true);
});

test('should be able to run find on any entity', async () => {
  await orm.em.find(LevelOne, {});
  await orm.em.find(LevelTwo, {});
  await orm.em.find(LevelThree, {});
});
