import { MikroORM, Collection, ValidationError } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, OneToMany, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
class A {

  @PrimaryKey()
  id!: number;

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
  let orm: MikroORM;

  beforeAll(async () => {
    orm = new MikroORM({
      metadataProvider: ReflectMetadataProvider,
      entities: [A, B],
      dbName: ':memory:',
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`GH issue 949`, async () => {
    let aEntity = new A();
    aEntity.bItems.add(new B());
    // Entity not managed yet
    await expect(aEntity.bItems.loadCount()).rejects.toThrow(ValidationError);

    await orm.em.persistAndFlush(aEntity);

    const reloadedBook = await aEntity.bItems.loadCount();
    expect(reloadedBook).toBe(1);

    // Adding new items
    const laterRemoved = new B();
    aEntity.bItems.add(laterRemoved, new B());
    const threeItms = await aEntity.bItems.loadCount(true);
    expect(threeItms).toEqual(3);
    orm.em.clear();

    // Updates when removing an item
    aEntity = (await orm.em.findOne(A, aEntity.id))!;
    expect(await aEntity.bItems.loadCount()).toEqual(3);
    await aEntity.bItems.init();
    aEntity.bItems.remove(aEntity.bItems[0]);
    expect(await aEntity.bItems.loadCount()).toEqual(2);
    expect(await aEntity.bItems.loadCount(true)).toEqual(2); // autoflush
    await orm.em.flush();
    orm.em.clear();

    // Resets the counter when hydrating
    aEntity = (await orm.em.findOne(A, aEntity.id))!;
    await aEntity.bItems.loadCount();
    aEntity.bItems.hydrate([]);
    expect(await aEntity.bItems.loadCount()).toEqual(0);
    expect(await aEntity.bItems.loadCount(true)).toEqual(2);
  });
});
