import { Entity, MikroORM, PrimaryKey, OneToMany, ManyToOne, Collection, ValidationError, ArrayCollection } from '@mikro-orm/core';
import type { SqliteDriver } from '@mikro-orm/sqlite';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  @OneToMany(() => B, b => b.a)
  bItems = new Collection<B>(this);

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => A, { nullable: true })
  a?: A;

}
describe('GH issue 949', () => {
  let orm: MikroORM<SqliteDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: ':memory:',
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 949`, async () => {
    let aEntity = new A();
    aEntity.bItems.add(new B());
    // Entity not managed yet
    expect(() => aEntity.bItems.loadCount()).rejects.toThrow(ValidationError);

    await orm.em.persistAndFlush(aEntity);

    if (!aEntity) { return; }
    const reloadedBook = await aEntity.bItems.loadCount();
    expect(reloadedBook).toBe(1);

    // Adding new items
    const laterRemoved = new B();
    aEntity.bItems.add(laterRemoved, new B());
    const threeItms = await aEntity.bItems.loadCount();
    expect(threeItms).toEqual(3);

    // Force refresh
    expect(await aEntity.bItems.loadCount(true)).toEqual(1);
    // Testing array collection implemntation
    await orm.em.flush();
    orm.em.clear();


    // Updates when removing an item
    aEntity = (await orm.em.findOne(A, aEntity.id))!;
    expect(await aEntity.bItems.loadCount()).toEqual(3);
    await aEntity.bItems.init();
    aEntity.bItems.remove(aEntity.bItems[0]);
    expect(await aEntity.bItems.loadCount()).toEqual(2);
    expect(await aEntity.bItems.loadCount(true)).toEqual(3);
    await orm.em.flush();
    orm.em.clear();

    // Resets the counter when hydrating
    aEntity = (await orm.em.findOne(A, aEntity.id))!;
    await aEntity.bItems.loadCount();
    aEntity.bItems.hydrate([]);
    expect(await aEntity.bItems.loadCount()).toEqual(0);
    expect(await aEntity.bItems.loadCount(true)).toEqual(2);

    // Code coverage ?
    const arryCollection = new ArrayCollection(aEntity);
    expect(await arryCollection.loadCount()).toEqual(0);
  });
});
