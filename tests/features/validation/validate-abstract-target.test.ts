import { Entity, Ref, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

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
    entities: [B],
    dbName: ':memory:',
  })).rejects.toThrow('B.a targets abstract entity A. Maybe you forgot to put @Entity() decorator on the A class?');
});
