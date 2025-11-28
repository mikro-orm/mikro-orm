import { Collection, MikroORM } from '@mikro-orm/sqlite';

import { Entity, ManyToOne, OneToMany, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property()
  prop!: string;

  @OneToMany(() => B, b => b)
  coll = new Collection<B>(this);

}

@Entity()
export class B {

  @PrimaryKey()
  id!: number;

  @ManyToOne(() => A, { nullable: true })
  a?: A;

}

describe('GH issue 2393', () => {

  test('cascade persist with pre-filled PK and with cycles', async () => {
    await expect(MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A, B],
      dbName: ':memory:',
    })).rejects.toThrow('A.coll has unknown \'mappedBy\' reference: B.undefined');
  });

});
