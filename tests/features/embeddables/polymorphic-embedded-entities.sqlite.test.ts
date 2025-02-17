import type { ObjectHydrator } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, Enum, MikroORM, OptionalProps, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { mockLogger } from '../../helpers.js';
import { SqliteDriver } from '@mikro-orm/sqlite';

enum AnimalType {
  CAT,
  DOG,
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class Animal {

  @Enum()
  type!: AnimalType;

  @Property()
  name!: string;

}

@Embeddable()
class CatFood {

  @Property()
  mice = 2;

}

@Embeddable()
class DogFood {

  @Property()
  cats = 10;

}

@Embeddable({ discriminatorValue: AnimalType.CAT })
class Cat extends Animal {

  @Property()
  canMeow? = true;

  @Embedded(() => CatFood)
  food? = new CatFood();

  constructor(name: string) {
    super();
    this.type = AnimalType.CAT;
    this.name = name;
  }

}

@Embeddable({ discriminatorValue: AnimalType.DOG })
class Dog extends Animal {

  @Property()
  canBark? = true;

  @Embedded(() => DogFood)
  food? = new DogFood();

  constructor(name: string) {
    super();
    this.type = AnimalType.DOG;
    this.name = name;
  }

}

@Entity()
class Owner {

  [OptionalProps]?: 'pets';

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Embedded()
  pet!: Cat | Dog;

  @Embedded({ object: true })
  pet2!: Cat | Dog;

  @Embedded()
  pets: (Cat | Dog)[] = [];

  constructor(name: string) {
    this.name = name;
  }

}

describe('polymorphic embeddables in sqlite', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Dog, Cat, Owner],
      dbName: ':memory:',
      driver: SqliteDriver,
      metadataProvider: TsMorphMetadataProvider,
      metadataCache: { enabled: false },
    });
    await orm.schema.createSchema();
  });

  afterAll(async () => {
    await orm.close();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Owner, {});
    orm.em.clear();
  });

  test(`schema`, async () => {
    await expect(orm.schema.getCreateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
    await expect(orm.schema.getUpdateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
    await expect(orm.schema.getDropSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
  });

  test(`diffing`, async () => {
    const hydrator = orm.config.getHydrator(orm.getMetadata()) as ObjectHydrator;
    expect(hydrator.getEntityHydrator(orm.getMetadata().get('Owner'), 'full').toString()).toMatchSnapshot();
    expect(orm.em.getComparator().getSnapshotGenerator('Owner').toString()).toMatchSnapshot();
  });

  test(`working with polymorphic embeddables`, async () => {
    const ent1 = new Owner('o1');
    ent1.pet = new Dog('d1');
    ent1.pet2 = new Cat('c3');
    ent1.pets.push(ent1.pet, ent1.pet2);
    expect(ent1.pet).toBeInstanceOf(Dog);
    expect((ent1.pet as Dog).canBark).toBe(true);
    expect(ent1.pet2).toBeInstanceOf(Cat);
    expect((ent1.pet2 as Cat).canMeow).toBe(true);
    const ent2 = orm.em.create(Owner, {
      name: 'o2',
      pet: { type: AnimalType.CAT, name: 'c1' },
      pet2: { type: AnimalType.DOG, name: 'd4' },
      pets: [
        { type: AnimalType.CAT, name: 'cc1' },
        { type: AnimalType.DOG, name: 'dd4' },
      ],
    });
    expect(ent2.pet).toBeInstanceOf(Cat);
    expect((ent2.pet as Cat).canMeow).toBe(true);
    expect(ent2.pet2).toBeInstanceOf(Dog);
    expect((ent2.pet2 as Dog).canBark).toBe(true);
    expect(ent2.pets[0]).toBeInstanceOf(Cat);
    expect((ent2.pets[0] as Cat).canMeow).toBe(true);
    expect(ent2.pets[1]).toBeInstanceOf(Dog);
    expect((ent2.pets[1] as Dog).canBark).toBe(true);
    const ent3 = orm.em.create(Owner, {
      name: 'o3',
      pet: { type: AnimalType.DOG, name: 'd2' },
      pet2: { type: AnimalType.CAT, name: 'c4' },
    });
    expect(ent3.pet).toBeInstanceOf(Dog);
    expect((ent3.pet as Dog).canBark).toBe(true);
    expect(ent3.pet2).toBeInstanceOf(Cat);
    expect((ent3.pet2 as Cat).canMeow).toBe(true);

    const mock = mockLogger(orm, ['query']);
    await orm.em.persistAndFlush([ent1, ent2, ent3]);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `owner` (`name`, `pet_type`, `pet_name`, `pet_can_meow`, `pet_food_mice`, `pet2`, `pets`, `pet_can_bark`, `pet_food_cats`) values (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?, ?, ?) returning `id`');
    expect(mock.mock.calls[2][0]).toMatch('commit');
    orm.em.clear();

    const owners = await orm.em.find(Owner, {}, { orderBy: { name: 1 } });
    expect(mock.mock.calls[3][0]).toMatch('select `o0`.* from `owner` as `o0` order by `o0`.`name` asc');
    expect(owners[0].name).toBe('o1');
    expect(owners[0].pet).toBeInstanceOf(Dog);
    expect(owners[0].pet.name).toBe('d1');
    expect(owners[0].pet.type).toBe(AnimalType.DOG);
    expect((owners[0].pet as Cat).canMeow).toBeNull();
    expect((owners[0].pet as Dog).canBark).toBe(true);
    expect(owners[0].pets[0]).toBeInstanceOf(Dog);
    expect(owners[0].pets[0].name).toBe('d1');
    expect(owners[0].pets[0].type).toBe(AnimalType.DOG);
    expect((owners[0].pets[0] as Cat).canMeow).toBeUndefined();
    expect((owners[0].pets[0] as Dog).canBark).toBe(true);
    expect(owners[0].pets[0]).not.toBe(owners[0].pet); // no identity map for embeddables as they don't have PKs
    expect(owners[0].pets[1]).not.toBe(owners[0].pet2); // no identity map for embeddables as they don't have PKs
    expect(owners[0].pets).toMatchObject([
      { canBark: true, name: 'd1', type: 1 },
      { canMeow: true, name: 'c3', type: 0 },
    ]);
    expect(owners[1].pet).toBeInstanceOf(Cat);
    expect(owners[1].pet.name).toBe('c1');
    expect(owners[1].pet.type).toBe(AnimalType.CAT);
    expect((owners[1].pet as Cat).canMeow).toBe(true);
    expect((owners[1].pet as Dog).canBark).toBeNull();
    expect(owners[1].pets).toMatchObject([
      { canMeow: true, name: 'cc1', type: 0 },
      { canBark: true, name: 'dd4', type: 1 },
    ]);
    expect(owners[2].pet).toBeInstanceOf(Dog);
    expect(owners[2].pet.name).toBe('d2');
    expect(owners[2].pet.type).toBe(AnimalType.DOG);
    expect(owners[2].pets).toEqual([]);

    expect(mock.mock.calls).toHaveLength(4);
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(4);

    owners[0].pet = new Cat('c2');
    owners[0].pets[0].name = 'new dog name';
    owners[0].pets[1].name = 'new cat name';
    owners[0].pets.push(new Dog('added dog'));
    owners[1].pet = new Dog('d3');
    owners[2].pet.name = 'old dog';
    mock.mock.calls.length = 0;
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('update `owner` set `pet_can_bark` = case when (`id` = ?) then ? when (`id` = ?) then ? else `pet_can_bark` end, `pet_food_cats` = case when (`id` = ?) then ? when (`id` = ?) then ? else `pet_food_cats` end, `pet_type` = case when (`id` = ?) then ? when (`id` = ?) then ? else `pet_type` end, `pet_name` = case when (`id` = ?) then ? when (`id` = ?) then ? when (`id` = ?) then ? else `pet_name` end, `pet_can_meow` = case when (`id` = ?) then ? when (`id` = ?) then ? else `pet_can_meow` end, `pet_food_mice` = case when (`id` = ?) then ? when (`id` = ?) then ? else `pet_food_mice` end, `pets` = case when (`id` = ?) then ? else `pets` end where `id` in (?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('commit');
    orm.em.clear();

    const owners2 = await orm.em.find(Owner, {}, { orderBy: { name: 1 } });
    expect(mock.mock.calls[3][0]).toMatch('select `o0`.* from `owner` as `o0` order by `o0`.`name` asc');

    expect(owners2[0].name).toBe('o1');
    expect(owners2[0].pet).toBeInstanceOf(Cat);
    expect(owners2[0].pet.name).toBe('c2');
    expect(owners2[0].pet.type).toBe(AnimalType.CAT);
    expect(owners2[0].pets[0].name).toBe('new dog name');
    expect(owners2[0].pets[1].name).toBe('new cat name');
    expect(owners2[0].pets[2].name).toBe('added dog');
    expect((owners2[0].pets[0] as Dog).canBark).toBe(true);
    expect((owners2[0].pets[1] as Cat).canMeow).toBe(true);
    expect((owners2[0].pets[2] as Dog).canBark).toBe(true);
    expect((owners2[0].pet as Dog).canBark).toBeNull();
    expect((owners2[0].pet as Cat).canMeow).toBe(true);

    expect(owners2[1].pet).toBeInstanceOf(Dog);
    expect(owners2[1].pet.name).toBe('d3');
    expect(owners2[1].pet.type).toBe(AnimalType.DOG);
    expect((owners2[1].pet as Dog).canBark).toBe(true);
    expect((owners2[1].pet as Cat).canMeow).toBeNull();

    expect(owners2[2].pet).toBeInstanceOf(Dog);
    expect(owners2[2].pet.name).toBe('old dog');
    expect(owners2[2].pet.type).toBe(AnimalType.DOG);
    expect((owners2[2].pet as Dog).canBark).toBe(true);
    expect((owners2[2].pet as Cat).canMeow).toBeNull();
    orm.em.clear();

    mock.mock.calls.length = 0;
    const dogOwners = await orm.em.find(Owner, { pet: { name: ['d3', 'old dog'] } }, { orderBy: { name: 1 } });
    const dogOwners2 = await orm.em.find(Owner, { pet2: { name: ['d4', 'c4'] } }, { orderBy: { name: 1 } });
    const dogOwners3 = await orm.em.find(Owner, { $or: [
      { pet: { name: ['d3', 'old dog'] } },
      { pet2: { name: ['d4', 'c4'] } },
    ] }, { orderBy: { name: 1 } });

    const check = (items: Owner[]) => {
      expect(items).toHaveLength(2);
      expect(items[0].pet).toBeInstanceOf(Dog);
      expect(items[0].pet.name).toBe('d3');
      expect(items[0].pet2).toBeInstanceOf(Dog);
      expect(items[0].pet2.name).toBe('d4');
      expect(items[1].pet).toBeInstanceOf(Dog);
      expect(items[1].pet.name).toBe('old dog');
      expect(items[1].pet2).toBeInstanceOf(Cat);
      expect(items[1].pet2.name).toBe('c4');
    };
    check(dogOwners);
    check(dogOwners2);
    check(dogOwners3);

    expect(mock.mock.calls[0][0]).toMatch('select `o0`.* from `owner` as `o0` where `o0`.`pet_name` in (?, ?) order by `o0`.`name` asc');
    expect(mock.mock.calls[1][0]).toMatch('select `o0`.* from `owner` as `o0` where json_extract(`o0`.`pet2`, \'$.name\') in (?, ?) order by `o0`.`name` asc');
    expect(mock.mock.calls[2][0]).toMatch('select `o0`.* from `owner` as `o0` where (`o0`.`pet_name` in (?, ?) or json_extract(`o0`.`pet2`, \'$.name\') in (?, ?)) order by `o0`.`name` asc');
  });

  test('assign and serialization', async () => {
    const owner = new Owner('o1');
    orm.em.assign(owner, {
      pet: { name: 'cat', type: AnimalType.CAT },
      pet2: { name: 'dog', type: AnimalType.DOG },
      pets: [
        { name: 'dog in array', type: AnimalType.DOG },
        { name: 'cat in array', type: AnimalType.CAT },
      ],
    });
    expect(owner.pet).toMatchObject({ name: 'cat', type: AnimalType.CAT });
    expect(owner.pet).toBeInstanceOf(Cat);
    expect(owner.pet2).toMatchObject({ name: 'dog', type: AnimalType.DOG });
    expect(owner.pet2).toBeInstanceOf(Dog);
    expect(owner.pets[0]).toMatchObject({ name: 'dog in array', type: AnimalType.DOG });
    expect(owner.pets[0]).toBeInstanceOf(Dog);
    expect(owner.pets[1]).toMatchObject({ name: 'cat in array', type: AnimalType.CAT });
    expect(owner.pets[1]).toBeInstanceOf(Cat);

    const mock = mockLogger(orm, ['query']);
    await orm.em.persistAndFlush(owner);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `owner` (`name`, `pet_type`, `pet_name`, `pet_can_meow`, `pet_food_mice`, `pet2`, `pets`) values (?, ?, ?, ?, ?, ?, ?) returning `id`');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    orm.em.assign(owner, {
      pet: { name: 'cat name' },
      pet2: { name: 'dog name' },
    });
    expect(() => orm.em.assign(owner, { pets: [{ name: '...' } ] })).toThrow('Cannot create entity Cat | Dog, class prototype is unknown');
    orm.em.assign(owner, {
      pets: [
        { name: 'cat in array', type: AnimalType.CAT },
        { name: 'dog in array', type: AnimalType.DOG },
        { name: 'cat in array 2', type: AnimalType.CAT },
      ],
    });
    await orm.em.persistAndFlush(owner);
    expect(mock.mock.calls[3][0]).toMatch('begin');

    // TODO the diffing here seems wrong
    expect(mock.mock.calls[4][0]).toMatch('update `owner` set `pet_name` = ?, `pet2` = ?, `pets` = ? where `id` = ?');
    expect(mock.mock.calls[5][0]).toMatch('commit');

    expect(wrap(owner).toObject()).toEqual({
      id: owner.id,
      name: 'o1',
      pet: {
        canMeow: true,
        name: 'cat name',
        type: 0,
        food: { mice: 2 },
      },
      pet2: {
        canBark: true,
        name: 'dog name',
        type: 1,
        food: { cats: 10 },
      },
      pets: [
        { canMeow: true, name: 'cat in array', type: 0, food: { mice: 2 } },
        { canBark: true, name: 'dog in array', type: 1, food: { cats: 10 } },
        { canMeow: true, name: 'cat in array 2', type: 0, food: { mice: 2 } },
      ],
    });
  });

});
