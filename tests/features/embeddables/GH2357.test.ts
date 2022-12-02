import { Embedded, Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

export class Options {

  @Property()
  loop!: string;

}

@Entity()
export class PlayerEntity {

  @PrimaryKey()
  id!: number;

  @Embedded(() => Options)
  options = new Options();

}

describe('validating not discovered emebddables', () => {

  test(`GH issue 2357`, async () => {
    await expect(MikroORM.init({
      entities: [PlayerEntity],
      dbName: ':memory:',
      driver: SqliteDriver,
    }, false)).rejects.toThrowError(`Entity 'Options' was not discovered, please make sure to provide it in 'entities' array when initializing the ORM (used in PlayerEntity.options)`);
  });

});
