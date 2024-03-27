import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/sqlite';

@Entity()
class EntityA {

  @PrimaryKey()
  id!: number;

  @OneToMany(() => EntityB, 'a')
  bs = new Collection<EntityB>(this);

}

@Entity()
class EntityB {

  @PrimaryKey()
  id!: number;

  @Property()
  test!: string;

  @ManyToOne(() => EntityA, { name: 'id', persist: false })
  a!: EntityA;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [EntityA, EntityB],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('delete entity from persist false relation', async () => {
  orm.em.create(EntityA, {
    bs: [{ test: 'qwer' }, { test: 'asdf' }, { test: 'yxcv' }],
  }, { persist: true });

  await orm.em.flush();
  await orm.em.nativeDelete(EntityB, { a: 1 });
});
