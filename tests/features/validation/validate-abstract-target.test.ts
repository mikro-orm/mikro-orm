import { Ref, MikroORM } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
class A {

  @PrimaryKey()
  id!: number;

  @Property({ type: 'string' })
  test!: string;

}

@Entity()
class B {

  @ManyToOne({ entity: () => A, primary: true, ref: true })
  a!: Ref<A>;

}

test('validates missing @Entity() decorator', async () => {
  await expect(MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [B],
    dbName: ':memory:',
  })).rejects.toThrow('B.a targets abstract entity A. Maybe you forgot to put @Entity() decorator on the A class?');
});
