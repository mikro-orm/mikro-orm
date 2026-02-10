import { MikroORM } from '@mikro-orm/sqlite';

import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
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
  await expect(
    MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [A, B],
      dbName: ':memory:',
    }),
  ).rejects.toThrow(
    'B.a is defined as scalar @Property(), but its type is a discovered entity A. Maybe you want to use @ManyToOne() decorator instead?',
  );
});
