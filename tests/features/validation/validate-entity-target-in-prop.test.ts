import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';

class A {

  @PrimaryKey()
  id!: number;

  @Property()
  test!: string;

}

@Entity()
class B {

  @PrimaryKey()
  id!: number;

  @Property()
  a!: A;

}

test('validates @Property() decorator targeting entity type', async () => {
  await expect(MikroORM.init({
    entities: [A, B],
    dbName: ':memory:',
  })).rejects.toThrowError('B.a is defined as scalar @Property(), but its type is a discovered entity A. Maybe you want to use @ManyToOne() decorator instead?');
});
