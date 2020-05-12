import {
  Entity,
  PrimaryKey,
  Property,
  MikroORM,
  ReflectMetadataProvider,
  SerializedPrimaryKey,
} from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
import { v4 } from 'uuid';
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

describe('GH issue 349', () => {

  let orm: MikroORM<MongoDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A],
      clientUrl: 'mongodb://localhost:27017,localhost:27018,localhost:27019/mikro-orm-test?replicaSet=rs0',
      type: 'mongo',
      metadataProvider: ReflectMetadataProvider,
      cache: { enabled: false },
    });
  });

  afterEach(async () => {
    await orm.em.remove(A, {});
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`should fetch document with uuid id type`, async () => {
    const name = 'test';
    const a = new A(name);
    const uuid = v4();
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
    const uuid1 = v4();
    a1._id = uuid1;
    expect(a1._id).toBe(uuid1);
    const a2 = new A('test2');
    const uuid2 = v4();
    a2._id = uuid2;
    expect(a2._id).toBe(uuid2);
    await orm.em.persistAndFlush([a1, a2]);
    orm.em.clear();
    const getAll = await orm.em.find<A>(A, {});
    expect(getAll[0]._id).not.toBeInstanceOf(ObjectId);
    expect(getAll[1]._id).not.toBeInstanceOf(ObjectId);
    orm.em.clear();
  });

});
