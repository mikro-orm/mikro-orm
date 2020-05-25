import {
  Entity,
  PrimaryKey,
  Property,
  MikroORM,
  ReflectMetadataProvider,
  SerializedPrimaryKey,
} from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { MongoDriver } from '@mikro-orm/mongodb';

@Entity()
class A {

  @PrimaryKey()
  _id!: string;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class B {

  @PrimaryKey()
  _id!: ObjectId;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}

@Entity()
class C {

  @PrimaryKey()
  _id!: number;

  @SerializedPrimaryKey()
  id!: string;

  @Property()
  name: string;

  constructor(name: string) {
    this.name = name;
  }

}


describe('GH issue 349', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C],
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs0',
      type: 'mongo',
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
  });

  afterEach(async () => {
    await orm.em.remove(A, {});
    await orm.em.remove(B, {});
    await orm.em.remove(C, {});
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`should fetch document with uuid id type`, async () => {
    const name = 'test';
    const a = new A(name);
    const uuid = '67f66459-63c5-4f27-8c59-abc382a1e5f6';
    a._id = uuid;
    expect(a._id).toBe(uuid);
    await orm.em.persistAndFlush(a);
    expect(a._id).not.toBeInstanceOf(ObjectId);
    orm.em.clear();

    const getA = await orm.em.findOneOrFail<A>(A,  a._id);
    expect(getA!._id).not.toBeInstanceOf(ObjectId);
    expect(getA!._id).toBe(uuid);
    expect(getA!.id).toBe(uuid);

    orm.em.clear();
  });

  test(`should fetch all documents with uuid _id type`, async () => {
    const a1 = new A('test1');
    const uuid1 = '67f66459-63c5-4f27-8c59-abc382a1e5f6';
    a1._id = uuid1;
    expect(a1._id).toBe(uuid1);
    const a2 = new A('test2');
    const uuid2 = 'b567730f-060f-4457-ae92-41bd25d26384';
    a2._id = uuid2;
    expect(a2._id).toBe(uuid2);
    await orm.em.persistAndFlush([a1, a2]);
    orm.em.clear();
    const getAll = await orm.em.find<A>(A, {});
    expect(getAll[0]._id).not.toBeInstanceOf(ObjectId);
    expect(getAll[1]._id).not.toBeInstanceOf(ObjectId);
    orm.em.clear();
  });

  test(`should not convert to objectId even if it can`, async () => {
    const a1 = new A('test1');
    const id = '5ea32a539c36ba7c62a99d60';
    a1._id = id;
    expect(a1._id).toBe(id);
    await orm.em.persistAndFlush(a1);
    orm.em.clear();
    const getA = await orm.em.findOneOrFail(A, a1._id);
    expect(getA._id).not.toBeInstanceOf(ObjectId);
    orm.em.clear();
  });

  test(`should convert to objectId if type is ObjectId`, async () => {
    const b = new B('test1');
    await orm.em.persistAndFlush(b);
    expect(b._id).toBeInstanceOf(ObjectId);
    orm.em.clear();
    const getB = await orm.em.findOneOrFail(B, b._id);
    expect(getB._id).toBeInstanceOf(ObjectId);
    orm.em.clear();
  });

  test(`should work with number id`, async () => {
    const c = new C('test1');
    const nrId = 234123412458902579342356;
    c._id = nrId;
    await orm.em.persistAndFlush(c);
    expect(c._id).not.toBeInstanceOf(ObjectId);
    expect(c._id).toStrictEqual(nrId);
    orm.em.clear();
    const getC = await orm.em.findOneOrFail(C, c._id);
    expect(getC._id).not.toBeInstanceOf(ObjectId);
    expect(getC._id).toStrictEqual(nrId);
    orm.em.clear();
  });

});
