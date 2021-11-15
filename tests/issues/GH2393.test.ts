import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property()
  prop!: string;

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
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
      entities: [A, B],
      dbName: ':memory:',
      type: 'sqlite',
    }, false)).rejects.toThrowError('A.coll has unknown \'mappedBy\' reference: B.undefined');
  });

});
