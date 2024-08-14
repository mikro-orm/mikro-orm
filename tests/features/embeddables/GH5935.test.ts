import { Entity, MikroORM, OptionalProps, PrimaryKey, Property, Type } from '@mikro-orm/sqlite';

class CatMetadataType extends Type {}
class DogMetadataType extends Type {}

@Entity({ discriminatorColumn: 'type', abstract: true })
class Pet {

  [OptionalProps]?: 'id' | 'type';

  @PrimaryKey()
  id!: number;

  @Property()
  type!: string;

}

@Entity({ discriminatorValue: 'cat' })
class Cat extends Pet {

  @Property({ type: CatMetadataType })
  metadata!: { purrsPerHour?: number };

}

@Entity({ discriminatorValue: 'dog' })
class Dog extends Pet {

  @Property({ type: DogMetadataType })
  metadata!: { enjoysPlayingFetch?: true };

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Pet, Cat, Dog],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('5935', async () => {
  const cat = orm.em.create(Cat, { metadata: { purrsPerHour: 4 } });
  const dog = orm.em.create(Dog, { metadata: { enjoysPlayingFetch: true } });

  expect(cat.metadata.purrsPerHour).toBe(4);
  expect(dog.metadata.enjoysPlayingFetch).toBe(true);
});
