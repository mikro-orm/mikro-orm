import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

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
    dbName: ':memory:',
    entities: [BaseMikro, LevelOne, LevelTwo, LevelThree],
  });
  await orm.schema.createSchema();
});

afterAll(async () => {
  await orm.close(true);
});

test('should be able to run find on any entity', async () => {
  await orm.em.find(LevelOne, {});
  await orm.em.find(LevelTwo, {});
  await orm.em.find(LevelThree, {});
});
