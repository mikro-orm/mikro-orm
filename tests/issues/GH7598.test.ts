import 'reflect-metadata';
import { Entity, Enum, ManyToOne, PrimaryKey, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM, Reference, type Ref } from '@mikro-orm/sqlite';

enum Species {
  DOG = 'DOG',
  CAT = 'CAT',
}

@Entity({ tableName: 'food', abstract: true, discriminatorColumn: 'species' })
abstract class Food {
  @PrimaryKey()
  id!: number;

  @Enum(() => Species)
  species!: Species;
}

@Entity({ discriminatorValue: Species.DOG })
class DogFood extends Food {}

@Entity({ discriminatorValue: Species.CAT })
class CatFood extends Food {}

@Entity({ tableName: 'pet', abstract: true, discriminatorColumn: 'species' })
abstract class Pet {
  @PrimaryKey()
  id!: number;

  @Enum(() => Species)
  species!: Species;

  @ManyToOne(() => Food)
  favoriteFood!: Ref<Food>;
}

@Entity({ discriminatorValue: Species.DOG })
class Dog extends Pet {
  @ManyToOne(() => DogFood)
  declare favoriteFood: Ref<DogFood>;
}

@Entity({ discriminatorValue: Species.CAT })
class Cat extends Pet {
  @ManyToOne(() => CatFood)
  declare favoriteFood: Ref<CatFood>;
}

test('STI subclass @ManyToOne override does not crash metadata discovery (GH #7598)', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Food, DogFood, CatFood, Pet, Dog, Cat],
    metadataProvider: ReflectMetadataProvider,
  });
  const meta = orm.getMetadata();
  expect(meta.get(Dog).discriminatorValue).toBe(Species.DOG);
  expect(meta.get(Cat).discriminatorValue).toBe(Species.CAT);
  expect(meta.get(Pet).properties.favoriteFood.fieldNames).toEqual(['favorite_food_id']);
  expect(meta.get(Dog).properties.favoriteFood.fieldNames).toEqual(['favorite_food_id']);
  expect(meta.get(Cat).properties.favoriteFood.fieldNames).toEqual(['favorite_food_id']);
  // root declaration must retain the abstract target so populates from the root resolve all children
  expect(meta.get(Pet).properties.favoriteFood.targetMeta?.className).toBe('Food');

  await orm.schema.refresh();

  const kibble = orm.em.create(DogFood, { id: 1, species: Species.DOG });
  const tuna = orm.em.create(CatFood, { id: 2, species: Species.CAT });
  orm.em.create(Dog, { id: 10, species: Species.DOG, favoriteFood: Reference.create(kibble) });
  orm.em.create(Cat, { id: 20, species: Species.CAT, favoriteFood: Reference.create(tuna) });
  await orm.em.flush();
  orm.em.clear();

  const pets = await orm.em.find(Pet, {}, { populate: ['favoriteFood'], orderBy: { id: 'asc' } });
  expect(pets).toHaveLength(2);
  expect(pets[0].favoriteFood).toMatchObject({ id: 1, species: Species.DOG });
  expect(pets[1].favoriteFood).toMatchObject({ id: 2, species: Species.CAT });

  await orm.close(true);
});
