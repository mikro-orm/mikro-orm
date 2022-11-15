import { Entity, MikroORM, PrimaryKey, Property, t } from '@mikro-orm/core';

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

  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property()
  name!: string;

}

@Entity({ discriminatorValue: 1 })
export class LevelThree extends LevelTwo {

  @PrimaryKey({ type: 'bigint' })
  id!: string;

  @Property()
  name!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    type: 'sqlite',
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
