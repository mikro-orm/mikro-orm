import { Collection, Entity, IdentifiedReference, ManyToOne, MikroORM, OneToMany, PrimaryKey, PrimaryKeyType } from '@mikro-orm/core';

@Entity()
export class Cat {

  [PrimaryKeyType]?: [string, string];

  @PrimaryKey()
  name!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @ManyToOne(() => User, { primary: true, onDelete: 'CASCADE', wrappedReference: true })
  user!: IdentifiedReference<User>;

}

@Entity()
export class User {

  @PrimaryKey()
  id!: string;

  @OneToMany(() => Cat, c => c.user, { eager: true, orphanRemoval: true })
  cats = new Collection<Cat>(this);

}

describe('GH 2723', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      dbName: ':memory:',
      type: 'sqlite',
      entities: [Cat, User],
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(() => orm.close(true));

  test('FK as PK and orphan removal/cascading', async () => {
    const user = orm.em.create(User, { id: 'TestUser' }, { persist: true });
    orm.em.create(Cat, { name: 'TestCat', user }, { persist: true });
    await orm.em.flush();
    orm.em.clear();

    const u = await orm.em.findOneOrFail(User, { id: 'TestUser' });
    orm.em.remove(u).flush();

    const users = await orm.em.count(User, {});
    const cats = await orm.em.count(User, {});
    expect(users + cats).toBe(0);
  });

});
