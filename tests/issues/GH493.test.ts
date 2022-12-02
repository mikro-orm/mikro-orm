import { BeforeDelete, BeforeUpdate, Entity, MikroORM, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';

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

  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: ':memory:',
      driver: SqliteDriver,
    });
    await orm.schema.dropSchema();
    await orm.schema.createSchema();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 493`, async () => {
    const a = new A();
    await orm.em.persistAndFlush(a);
    a.name = 'test';
    await expect(orm.em.flush()).rejects.toThrowError('You cannot call em.flush() from inside lifecycle hook handlers');
    orm.em.remove(a);
    await expect(orm.em.flush()).rejects.toThrowError('You cannot call em.flush() from inside lifecycle hook handlers');
  });
});
