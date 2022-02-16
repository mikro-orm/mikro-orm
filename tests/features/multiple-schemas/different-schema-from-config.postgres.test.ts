import { Entity, MikroORM, PrimaryKey, wrap } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class CoreEntity {

  @PrimaryKey()
  id!: number;

}

describe('different schema from config', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'postgresql',
      dbName: 'mikro_orm_test_gh_2740',
      schema: 'privateschema',
      entities: [CoreEntity],
    });
    await orm.getSchemaGenerator().refreshDatabase();
  });

  afterAll(async () => {
    await orm.close();
  });

  it('should respect the global schema config', async () => {
    const entity = new CoreEntity();
    await orm.em.persistAndFlush(entity);
    expect(entity.id).toBeDefined();
    orm.em.clear();

    const e = await orm.em.findOne(CoreEntity, entity);
    expect(e).not.toBeNull();
    expect(wrap(e).getSchema()).toBe('privateschema');
  });

});
