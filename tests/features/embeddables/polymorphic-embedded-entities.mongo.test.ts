import { Embeddable, Embedded, Entity, Enum, MikroORM, PrimaryKey, Property, SerializedPrimaryKey, wrap } from '@mikro-orm/core';
import type { MongoDriver } from '@mikro-orm/mongodb';
import { ObjectId } from 'bson';
import { mockLogger } from '../../helpers';

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
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name!: string;

  @Embedded(() => [Cat, Dog])
  pet!: Cat | Dog;

  @Embedded(() => [Cat, Dog], { object: true })
  pet2!: Cat | Dog;

}

describe('polymorphic embeddables in mongo', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [Dog, Cat, Owner],
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test-poly-embeddables?replicaSet=rs',
      type: 'mongo',
      validate: true,
    });
  });

  afterAll(async () => {
    await orm.em.getDriver().dropCollections();
    await orm.close();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(Owner, {});
    orm.em.clear();
  });

  test(`working with polymorphic embeddables`, async () => {
    const ent1 = new Owner();
    ent1._id = new ObjectId('600000000000000000000001');
    ent1.name = 'o1';
    ent1.pet = new Dog('d1');
    ent1.pet2 = new Cat('c3');
    expect(ent1.pet).toBeInstanceOf(Dog);
    expect((ent1.pet as Dog).canBark).toBe(true);
    expect(ent1.pet2).toBeInstanceOf(Cat);
    expect((ent1.pet2 as Cat).canMeow).toBe(true);
    const ent2 = orm.em.create(Owner, {
      id: '600000000000000000000002',
      name: 'o2',
      pet: { type: AnimalType.CAT, name: 'c1' },
      pet2: { type: AnimalType.DOG, name: 'd4' },
    });
    expect(ent2.pet).toBeInstanceOf(Cat);
    expect((ent2.pet as Cat).canMeow).toBe(true);
    expect(ent2.pet2).toBeInstanceOf(Dog);
    expect((ent2.pet2 as Dog).canBark).toBe(true);
    const ent3 = orm.em.create(Owner, {
      id: '600000000000000000000003',
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
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('owner').insertMany([ { _id: ObjectId('600000000000000000000001'), name: 'o1', pet_canBark: true, pet_type: 1, pet_name: 'd1', pet_canMeow: undefined, pet2: { type: 0, name: 'c3', canMeow: true } }, { _id: ObjectId('600000000000000000000002'), name: 'o2', pet_canBark: undefined, pet_type: 0, pet_name: 'c1', pet_canMeow: true, pet2: { canBark: true, type: 1, name: 'd4' } }, { _id: ObjectId('600000000000000000000003'), name: 'o3', pet_canBark: true, pet_type: 1, pet_name: 'd2', pet_canMeow: undefined, pet2: { type: 0, name: 'c4', canMeow: true } } ], { session: undefined });`);
    orm.em.clear();

    const owners = await orm.em.find(Owner, {}, { orderBy: { name: 1 } });
    expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('owner').find({}, { session: undefined }).sort([ [ 'name', 1 ] ]).toArray();`);
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

    expect(mock.mock.calls).toHaveLength(2);
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(2);

    owners[0].pet = new Cat('c2');
    owners[1].pet = new Dog('d3');
    owners[2].pet.name = 'old dog';
    mock.mock.calls.length = 0;
    await orm.em.flush();
    expect(mock.mock.calls).toHaveLength(1);
    expect(mock.mock.calls[0][0]).toMatch(`bulk = db.getCollection('owner').initializeUnorderedBulkOp({ session: undefined });bulk.find({ _id: ObjectId('600000000000000000000001') }).update({ '$set': { pet_canBark: undefined, pet_type: 0, pet_name: 'c2', pet_canMeow: true } });bulk.find({ _id: ObjectId('600000000000000000000002') }).update({ '$set': { pet_canBark: true, pet_type: 1, pet_name: 'd3', pet_canMeow: undefined } });bulk.find({ _id: ObjectId('600000000000000000000003') }).update({ '$set': { pet_name: 'old dog' } });bulk.execute()`);
    orm.em.clear();

    const owners2 = await orm.em.find(Owner, {}, { orderBy: { name: 1 } });
    expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('owner').find({}, { session: undefined }).sort([ [ 'name', 1 ] ]).toArray();`);

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

    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('owner').find({ pet_name: { '$in': [ 'd3', 'old dog' ] } }, { session: undefined }).sort([ [ 'name', 1 ] ]).toArray();`);
    expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('owner').find({ 'pet2.name': { '$in': [ 'd4', 'c4' ] } }, { session: undefined }).sort([ [ 'name', 1 ] ]).toArray();`);
    expect(mock.mock.calls[2][0]).toMatch(`db.getCollection('owner').find({ '$or': [ { pet_name: { '$in': [ 'd3', 'old dog' ] } }, { 'pet2.name': { '$in': [ 'd4', 'c4' ] } } ] }, { session: undefined }).sort([ [ 'name', 1 ] ]).toArray();`);
  });

  test('assign and serialization', async () => {
    const owner = new Owner();
    owner._id = new ObjectId('600000000000000000000004');
    owner.name = 'o1';
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
    expect(mock.mock.calls[0][0]).toMatch(`db.getCollection('owner').insertOne({ _id: ObjectId('600000000000000000000004'), name: 'o1', pet_canBark: undefined, pet_type: 0, pet_name: 'cat', pet_canMeow: true, pet2: { canBark: true, type: 1, name: 'dog' } }, { session: undefined });`);

    orm.em.assign(owner, {
      pet: { name: 'cat name' },
      pet2: { name: 'dog name' },
    });
    await orm.em.persistAndFlush(owner);
    expect(mock.mock.calls[1][0]).toMatch(`db.getCollection('owner').updateMany({ _id: ObjectId('600000000000000000000004') }, { '$set': { pet_name: 'cat name', pet2: { canBark: true, type: 1, name: 'dog name' } } }, { session: undefined });`);

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
