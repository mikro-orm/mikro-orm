import { unlinkSync } from 'fs';
import { BeforeDelete, BeforeUpdate, Entity, MikroORM, PrimaryKey, Property, ReflectMetadataProvider, wrap } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { BASE_DIR } from '../bootstrap';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  name?: string;

  @BeforeUpdate()
  async beforeUpdate() {
    await wrap(this, true).__em!.flush();
  }

  @BeforeDelete()
  async beforeDelete() {
    await wrap(this, true).__em!.flush();
  }

}

describe('GH issue 493', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: BASE_DIR + '/../temp/mikro_orm_test_gh493.db',
      type: 'sqlite',
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
      highlight: false,
    });
    await orm.getSchemaGenerator().dropSchema();
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
    unlinkSync(orm.config.get('dbName')!);
  });

  test(`GH issue 493`, async () => {
    const a = new A();
    await orm.em.persistAndFlush(a);
    a.name = 'test';
    await expect(orm.em.flush()).rejects.toThrowError('You cannot call em.flush() from inside lifecycle hook handlers');
    orm.em.removeEntity(a);
    await expect(orm.em.flush()).rejects.toThrowError('You cannot call em.flush() from inside lifecycle hook handlers');
  });
});
