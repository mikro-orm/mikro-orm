import { defineEntity, MikroORM, p } from '@mikro-orm/sqlite';

enum AnimalType {
  CAT = 'cat',
  DOG = 'dog',
}

const AnimalSchema = defineEntity({
  name: 'Animal',
  embeddable: true,
  abstract: true,
  discriminatorColumn: 'type',
  properties: {
    type: p.enum(() => AnimalType),
    name: p.string(),
  },
});

class Animal extends AnimalSchema.class {}
AnimalSchema.setClass(Animal);

const CatSchema = defineEntity({
  name: 'Cat',
  embeddable: true,
  // matches the original repro: child extends the parent *class*, not the schema —
  // exercises the `EntityCtor<TBase> & { '~discriminatorColumn'?: … }` arm of `extends?`.
  extends: Animal,
  discriminatorValue: AnimalType.CAT,
  properties: {
    canMeow: p.boolean().nullable(),
  },
});

class Cat extends CatSchema.class {}
CatSchema.setClass(Cat);

const DogSchema = defineEntity({
  name: 'Dog',
  embeddable: true,
  extends: Animal,
  discriminatorValue: AnimalType.DOG,
  properties: {
    canBark: p.boolean().nullable(),
  },
});

class Dog extends DogSchema.class {}
DogSchema.setClass(Dog);

const OwnerSchema = defineEntity({
  name: 'Owner',
  properties: {
    id: p.integer().primary(),
    name: p.string(),
    pet: () => p.embedded([Cat, Dog]),
  },
});

class Owner extends OwnerSchema.class {}
OwnerSchema.setClass(Owner);

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Owner],
  });
  await orm.schema.refresh();
});

afterAll(async () => {
  await orm.close(true);
});

test('discriminator on embedded inheritance narrows the union', async () => {
  orm.em.create(Owner, { id: 1, name: 'Foo', pet: { type: AnimalType.CAT, name: 'Whiskers', canMeow: true } });
  orm.em.create(Owner, { id: 2, name: 'Bar', pet: { type: AnimalType.DOG, name: 'Rex', canBark: true } });
  await orm.em.flush();
  orm.em.clear();

  const owners = await orm.em.findAll(Owner, { orderBy: { id: 'asc' } });

  let meows = 0;
  let barks = 0;

  // The `owner.pet.type === ...` checks must narrow `Cat | Dog` so the subtype-only
  // properties (`canMeow`, `canBark`) compile without a cast — that's the bug under test.
  for (const owner of owners) {
    if (owner.pet.type === AnimalType.CAT) {
      if (owner.pet.canMeow) {
        meows++;
      }
    } else if (owner.pet.canBark) {
      barks++;
    }
  }

  expect(meows).toBe(1);
  expect(barks).toBe(1);
});
