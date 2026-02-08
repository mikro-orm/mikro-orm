import { MikroORM, wrap } from '@mikro-orm/sqlite';
import { BeforeDelete, BeforeUpdate, Entity, Enum, PrimaryKey, Property } from '@mikro-orm/decorators/es';

@Entity()
class A {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string', nullable: true })
  name?: string;

  @Enum({ items: ['a', 'b'], nullable: true })
  type?: 'a' | 'b';

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
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      dbName: ':memory:',
    });
    await orm.schema.refresh();
  });

  afterAll(() => orm.close(true));

  test(`GH issue 493`, async () => {
    const a = new A();
    await orm.em.persist(a).flush();
    a.name = 'test';
    await expect(orm.em.flush()).rejects.toThrow('You cannot call em.flush() from inside lifecycle hook handlers');
    orm.em.remove(a);
    await expect(orm.em.flush()).rejects.toThrow('You cannot call em.flush() from inside lifecycle hook handlers');
  });
});
