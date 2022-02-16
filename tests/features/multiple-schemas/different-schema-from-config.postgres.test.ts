import { Entity, MikroORM, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class CoreEntity {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

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

  beforeEach(async () => {
    await orm.em.nativeDelete(CoreEntity, {});
    orm.em.clear();
  });

  it('should respect the global schema config', async () => {
    const entity = new CoreEntity('n');
    await orm.em.persistAndFlush(entity);
    expect(entity.id).toBeDefined();
    orm.em.clear();

    const e = await orm.em.findOne(CoreEntity, entity);
    expect(e).not.toBeNull();
    expect(wrap(e).getSchema()).toBe('privateschema');
  });

  it('should respect the global schema config (multi insert)', async () => {
    await orm.em.fork().persistAndFlush([new CoreEntity('n1'), new CoreEntity('n2'), new CoreEntity('n3')]);

    const res = await orm.em.find(CoreEntity, {});
    expect(res).toHaveLength(3);
    expect(wrap(res[0]).getSchema()).toBe('privateschema');
    expect(wrap(res[1]).getSchema()).toBe('privateschema');
    expect(wrap(res[2]).getSchema()).toBe('privateschema');

    res.forEach(row => row.name = `name ${row.id}`);
    await orm.em.flush();
  });

});
