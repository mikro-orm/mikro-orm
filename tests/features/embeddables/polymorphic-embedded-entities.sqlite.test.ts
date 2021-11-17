import type { ObjectHydrator } from '@mikro-orm/core';
import { Embeddable, Embedded, Entity, Enum, MikroORM, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { mockLogger } from '../../bootstrap';

enum AnimalType {
  CAT,
  DOG,
}

@Embeddable({ abstract: true, discriminatorColumn: 'type' })
abstract class Animal {

  @Enum(() => AnimalType)
  type!: AnimalType;

  @Property()
  name!: string;

}

@Embeddable({ discriminatorValue: AnimalType.CAT })
class Cat extends Animal {

  @Property({ nullable: true })
  canMeow?: boolean = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.CAT;
    this.name = name;
  }

}

@Embeddable({ discriminatorValue: AnimalType.DOG })
class Dog extends Animal {

  @Property({ nullable: true })
  canBark?: boolean = true;

  constructor(name: string) {
    super();
    this.type = AnimalType.DOG;
    this.name = name;
  }

}

@Entity()
class Owner {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @Embedded(() => [Cat, Dog])
  pet!: Cat | Dog;

  @Embedded(() => [Cat, Dog], { object: true })
  pet2!: Cat | Dog;

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
      type: 'sqlite',
    });
    await orm.getSchemaGenerator().createSchema();
  });

  afterAll(async () => {
    await orm.close();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Owner, {});
    orm.em.clear();
  });

  test(`schema`, async () => {
    await expect(orm.getSchemaGenerator().getCreateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
    await expect(orm.getSchemaGenerator().getUpdateSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
    await expect(orm.getSchemaGenerator().getDropSchemaSQL({ wrap: false })).resolves.toMatchSnapshot();
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
    expect(ent1.pet).toBeInstanceOf(Dog);
    expect((ent1.pet as Dog).canBark).toBe(true);
    expect(ent1.pet2).toBeInstanceOf(Cat);
    expect((ent1.pet2 as Cat).canMeow).toBe(true);
    const ent2 = orm.em.create(Owner, {
      name: 'o2',
      pet: { type: AnimalType.CAT, name: 'c1' },
      pet2: { type: AnimalType.DOG, name: 'd4' },
    });
    expect(ent2.pet).toBeInstanceOf(Cat);
    expect((ent2.pet as Cat).canMeow).toBe(true);
    expect(ent2.pet2).toBeInstanceOf(Dog);
    expect((ent2.pet2 as Dog).canBark).toBe(true);
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
    expect(mock.mock.calls[1][0]).toMatch('insert into `owner` (`name`, `pet_can_bark`, `pet_type`, `pet_name`, `pet_can_meow`, `pet2`) values (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)');
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
    expect(owners[1].pet).toBeInstanceOf(Cat);
    expect(owners[1].pet.name).toBe('c1');
    expect(owners[1].pet.type).toBe(AnimalType.CAT);
    expect((owners[1].pet as Cat).canMeow).toBe(true);
    expect((owners[1].pet as Dog).canBark).toBeNull();
    expect(owners[2].pet).toBeInstanceOf(Dog);
    expect(owners[2].pet.name).toBe('d2');
    expect(owners[2].pet.type).toBe(AnimalType.DOG);

    expect(mock.mock.calls).toHaveLength(4);
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(4);

    owners[0].pet = new Cat('c2');
    owners[1].pet = new Dog('d3');
    owners[2].pet.name = 'old dog';
    mock.mock.calls.length = 0;
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(3);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('update `owner` set `pet_can_bark` = case when (`id` = ?) then ? when (`id` = ?) then ? else `pet_can_bark` end, `pet_type` = case when (`id` = ?) then ? when (`id` = ?) then ? else `pet_type` end, `pet_name` = case when (`id` = ?) then ? when (`id` = ?) then ? when (`id` = ?) then ? else `pet_name` end, `pet_can_meow` = case when (`id` = ?) then ? when (`id` = ?) then ? else `pet_can_meow` end where `id` in (?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('commit');
    orm.em.clear();

    const owners2 = await orm.em.find(Owner, {}, { orderBy: { name: 1 } });
    expect(mock.mock.calls[3][0]).toMatch('select `o0`.* from `owner` as `o0` order by `o0`.`name` asc');

    expect(owners2[0].name).toBe('o1');
    expect(owners2[0].pet).toBeInstanceOf(Cat);
    expect(owners2[0].pet.name).toBe('c2');
    expect(owners2[0].pet.type).toBe(AnimalType.CAT);
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
    });
    expect(owner.pet).toMatchObject({ name: 'cat', type: AnimalType.CAT });
    expect(owner.pet).toBeInstanceOf(Cat);
    expect(owner.pet2).toMatchObject({ name: 'dog', type: AnimalType.DOG });
    expect(owner.pet2).toBeInstanceOf(Dog);

    const mock = mockLogger(orm, ['query']);
    await orm.em.persistAndFlush(owner);
    expect(mock.mock.calls[0][0]).toMatch('begin');
    expect(mock.mock.calls[1][0]).toMatch('insert into `owner` (`name`, `pet2`, `pet_can_bark`, `pet_can_meow`, `pet_name`, `pet_type`) values (?, ?, ?, ?, ?, ?)');
    expect(mock.mock.calls[2][0]).toMatch('commit');

    orm.em.assign(owner, {
      pet: { name: 'cat name' },
      pet2: { name: 'dog name' },
    });
    await orm.em.persistAndFlush(owner);
    expect(mock.mock.calls[3][0]).toMatch('begin');
    expect(mock.mock.calls[4][0]).toMatch('update `owner` set `pet_name` = ?, `pet2` = ? where `id` = ?');
    expect(mock.mock.calls[5][0]).toMatch('commit');

    expect(wrap(owner).toObject()).toEqual({
      id: owner.id,
      name: 'o1',
      pet: {
        canMeow: true,
        name: 'cat name',
        type: 0,
      },
      pet2: {
        canBark: true,
        name: 'dog name',
        type: 1,
      },
    });
  });

});
