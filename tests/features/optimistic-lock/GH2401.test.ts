import { MikroORM } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class Versioned {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ version: true })
  version: number = 0;

}

describe('GH issue 2401', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Versioned],
      dbName: `mikro_orm_test_gh_2401`,
      driver: PostgreSqlDriver,
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test(`postgres version insert should not fail`, async () => {
    const instance = new Versioned();
    instance.name = 'name1';

    await orm.em.persist(instance).flush();

    instance.name = 'name2';

    await orm.em.flush();
  });

});
