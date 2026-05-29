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

@Entity({ abstract: true, discriminatorColumn: 'type', discriminatorMap: { dog: 'Dog', cat: 'Cat', bird: 'Bird' } })
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

@Entity({ discriminatorValue: 'bird' })
class Bird extends Animal {
  @OneToOne(() => Owner, { owner: true, ref: true })
  owner!: Ref<Owner>;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Owner, Animal, Dog, Cat, Bird],
    metadataProvider: ReflectMetadataProvider,
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('GH #7805 - @OneToOne in 3+ STI variants should not produce a simple unique constraint on FK alone', async () => {
  const sql = await orm.schema.getCreateSchemaSQL();

  // Should NOT have a simple unique index on just owner_id
  expect(sql).not.toMatch(/unique.*\(`owner_id`\)/i);

  // Should have a composite unique including the discriminator column
  expect(sql).toMatch(/unique.*\(`owner_id`, `type`\)/i);

  // Functional test: dog, cat and bird can all reference the same Owner
  const em = orm.em.fork();
  const owner1 = em.create(Owner, { name: 'Alice' });
  em.create(Dog, { owner: owner1 });
  em.create(Cat, { owner: owner1 });
  em.create(Bird, { owner: owner1 });

  await em.flush();

  expect(await em.count(Dog, {})).toBe(1);
  expect(await em.count(Cat, {})).toBe(1);
  expect(await em.count(Bird, {})).toBe(1);
});
