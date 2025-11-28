import { MikroORM } from '@mikro-orm/core';
import { Embedded, Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
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
      metadataProvider: ReflectMetadataProvider,
      entities: [PlayerEntity],
      dbName: ':memory:',
      driver: SqliteDriver,
    })).rejects.toThrow(`Entity 'Options' was not discovered, please make sure to provide it in 'entities' array when initializing the ORM (used in PlayerEntity.options)`);
  });

});
