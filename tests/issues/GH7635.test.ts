import 'reflect-metadata';
import {
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';
import { Collection, MikroORM } from '@mikro-orm/sqlite';

enum Species {
  DOG = 'DOG',
  CAT = 'CAT',
}

@Entity({ tableName: 'pet', abstract: true, discriminatorColumn: 'species' })
abstract class Pet {
  @PrimaryKey()
  id!: number;

  @Enum(() => Species)
  species!: Species;

  // Narrowed inverse-side: root declares broad target, children narrow within the same hierarchy.
  @OneToMany(() => Toy, t => t.owner)
  toys = new Collection<Toy>(this);
}

@Entity({ discriminatorValue: Species.DOG })
class Dog extends Pet {
  @OneToMany(() => DogToy, t => t.owner)
  declare toys: Collection<DogToy>;

  // Disjoint inverse-side: same property name on each child, targets share no base.
  @OneToMany(() => DogItem, i => i.dog)
  items = new Collection<DogItem>(this);
}

@Entity({ discriminatorValue: Species.CAT })
class Cat extends Pet {
  @OneToMany(() => CatToy, t => t.owner)
  declare toys: Collection<CatToy>;

  @OneToMany(() => CatItem, i => i.cat)
  items = new Collection<CatItem>(this);
}

@Entity({ tableName: 'toy', abstract: true, discriminatorColumn: 'species' })
abstract class Toy {
  @PrimaryKey()
  id!: number;

  @Enum(() => Species)
  species!: Species;

  @ManyToOne(() => Pet)
  owner!: Pet;
}

@Entity({ discriminatorValue: Species.DOG })
class DogToy extends Toy {}

@Entity({ discriminatorValue: Species.CAT })
class CatToy extends Toy {}

@Entity()
class DogItem {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Dog)
  dog!: Dog;
}

@Entity()
class CatItem {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Cat)
  cat!: Cat;
}

test('STI subclass @OneToMany override does not crash metadata discovery (GH #7635)', async () => {
  const orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Pet, Dog, Cat, Toy, DogToy, CatToy, DogItem, CatItem],
    metadataProvider: ReflectMetadataProvider,
  });
  const meta = orm.getMetadata();

  // narrowed override: children resolve to subtypes; root keeps the abstract target so populates from the root resolve all children
  expect(meta.get(Dog).properties.toys.type).toBe('DogToy');
  expect(meta.get(Cat).properties.toys.type).toBe('CatToy');
  expect(meta.get(Pet).properties.toys.type).toBe('Toy');

  // disjoint override: each child keeps its own typed inverse-side relation
  expect(meta.get(Dog).properties.items.type).toBe('DogItem');
  expect(meta.get(Cat).properties.items.type).toBe('CatItem');

  await orm.schema.refresh();

  const dog = orm.em.create(Dog, { id: 1, species: Species.DOG });
  const cat = orm.em.create(Cat, { id: 2, species: Species.CAT });
  orm.em.create(DogToy, { id: 10, species: Species.DOG, owner: dog });
  orm.em.create(CatToy, { id: 20, species: Species.CAT, owner: cat });
  orm.em.create(DogItem, { id: 100, dog });
  orm.em.create(CatItem, { id: 200, cat });
  await orm.em.flush();
  orm.em.clear();

  const dogs = await orm.em.find(Dog, {}, { populate: ['toys', 'items'] });
  expect(dogs).toHaveLength(1);
  expect(dogs[0].toys.map(t => t.id)).toEqual([10]);
  expect(dogs[0].items.map(i => i.id)).toEqual([100]);

  const cats = await orm.em.find(Cat, {}, { populate: ['toys', 'items'] });
  expect(cats).toHaveLength(1);
  expect(cats[0].toys.map(t => t.id)).toEqual([20]);
  expect(cats[0].items.map(i => i.id)).toEqual([200]);

  await orm.close(true);
});
