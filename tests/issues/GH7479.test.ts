import type { Ref } from '@mikro-orm/sqlite';
import { MikroORM, OptionalProps } from '@mikro-orm/sqlite';
import { Entity, Enum, OneToOne, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Owner {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity({ abstract: true, discriminatorColumn: 'type', discriminatorMap: { dog: 'Dog', cat: 'Cat' } })
abstract class Animal {
  [OptionalProps]?: 'type';

  @PrimaryKey()
  id!: number;

  @Enum()
  type!: string;
}

@Entity({ discriminatorValue: 'dog' })
class Dog extends Animal {
  @OneToOne(() => Owner, { owner: true, ref: true })
  owner!: Ref<Owner>;
}

@Entity({ discriminatorValue: 'cat' })
class Cat extends Animal {
  @OneToOne(() => Owner, { owner: true, ref: true })
  owner!: Ref<Owner>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Owner, Animal, Dog, Cat],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7479 - @OneToOne in multiple STI variants should not produce a unique constraint on FK alone', async () => {
  // The generated schema should have a composite unique on (type, owner_id),
  // not a simple unique on (owner_id) alone
  const sql = await orm.schema.getCreateSchemaSQL();

  // Should NOT have a simple unique index on just owner_id
  expect(sql).not.toMatch(/unique.*\(`owner_id`\)/i);

  // Should have a composite unique including the discriminator column
  expect(sql).toMatch(/unique.*\(`owner_id`, `type`\)/i);

  // Functional test: both a Dog and Cat can reference the same Owner
  const em = orm.em.fork();
  const owner1 = em.create(Owner, { name: 'Alice' });
  const owner2 = em.create(Owner, { name: 'Bob' });
  em.create(Dog, { owner: owner1 });
  em.create(Cat, { owner: owner1 }); // same owner for different animal types
  em.create(Dog, { owner: owner2 });

  // This should not throw a unique constraint violation
  await em.flush();

  const dogs = await em.find(Dog, {});
  const cats = await em.find(Cat, {});
  expect(dogs).toHaveLength(2);
  expect(cats).toHaveLength(1);
});
