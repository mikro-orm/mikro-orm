import { Collection, MikroORM, type Opt } from '@mikro-orm/sqlite';
import {
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  ReflectMetadataProvider,
} from '@mikro-orm/decorators/legacy';

@Entity({ inheritance: 'tpt' })
class Animal {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true, nullable: true })
  code?: string;

  @ManyToOne(() => Animal, { nullable: true })
  parent?: Animal;

  @OneToMany(() => Animal, a => a.parent)
  children = new Collection<Animal>(this);

  @OneToOne(() => Animal, { nullable: true })
  mate?: Animal;
}

@Entity()
class Dog extends Animal {
  @Property()
  breed!: string;

  @Property({ unique: true, nullable: true })
  tag?: string;
}

@Entity({ inheritance: 'tpt' })
class Vehicle {
  @PrimaryKey()
  id!: number;

  @Property({ version: true, type: 'integer' })
  version!: number & Opt;
}

@Entity()
class Car extends Vehicle {
  @Property({ unique: true, nullable: true })
  plate?: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [Animal, Dog, Vehicle, Car],
    dbName: ':memory:',
    metadataProvider: ReflectMetadataProvider,
  });
});

beforeEach(() => orm.schema.refresh());
afterAll(() => orm.close(true));

async function rows() {
  return orm.em.fork().getConnection().execute('select id, parent_id, mate_id, code from animal order by id');
}

test('self-referencing m:1 on the TPT root is saved when both entities are created in one flush', async () => {
  const em = orm.em.fork();
  const d1 = em.create(Dog, { name: 'd1', breed: 'b' });
  em.create(Dog, { name: 'd2', breed: 'b', parent: d1 });
  await em.flush();

  expect(await rows()).toMatchObject([
    { id: 1, parent_id: null },
    { id: 2, parent_id: 1 },
  ]);
});

test('self-referencing m:1 on the TPT root set from the collection side', async () => {
  const em = orm.em.fork();
  const d1 = em.create(Dog, { name: 'd1', breed: 'b' });
  const d2 = em.create(Dog, { name: 'd2', breed: 'b' });
  d1.children.add(d2);
  await em.flush();

  expect(await rows()).toMatchObject([
    { id: 1, parent_id: null },
    { id: 2, parent_id: 1 },
  ]);
});

test('self-referencing owning 1:1 on the TPT root is saved when both entities are created in one flush', async () => {
  const em = orm.em.fork();
  const d1 = em.create(Dog, { name: 'd1', breed: 'b' });
  em.create(Dog, { name: 'd2', breed: 'b', mate: d1 });
  await em.flush();

  expect(await rows()).toMatchObject([
    { id: 1, mate_id: null },
    { id: 2, mate_id: 1 },
  ]);
});

test('moving unique root and subclass properties between two loaded TPT entities', async () => {
  const em = orm.em.fork();
  em.create(Dog, { name: 'd1', breed: 'b', code: 'c1', tag: 't1' });
  em.create(Dog, { name: 'd2', breed: 'b' });
  await em.flush();
  em.clear();

  const [d1, d2] = await em.find(Dog, {}, { orderBy: { id: 'asc' } });
  d2.code = d1.code;
  d2.tag = d1.tag;
  d1.code = undefined;
  d1.tag = undefined;
  await em.flush();

  expect(await rows()).toMatchObject([
    { id: 1, code: null },
    { id: 2, code: 'c1' },
  ]);
  expect(await orm.em.fork().getConnection().execute('select id, tag from dog order by id')).toEqual([
    { id: 1, tag: null },
    { id: 2, tag: 't1' },
  ]);
});

test('moving a unique subclass property bumps the version declared on the TPT root', async () => {
  const em = orm.em.fork();
  em.create(Car, { plate: 'p1' });
  em.create(Car, {});
  await em.flush();
  em.clear();

  const [c1, c2] = await em.find(Car, {}, { orderBy: { id: 'asc' } });
  c2.plate = c1.plate;
  c1.plate = undefined;
  await em.flush();

  expect(await orm.em.fork().getConnection().execute('select id, plate from car order by id')).toEqual([
    { id: 1, plate: null },
    { id: 2, plate: 'p1' },
  ]);
  expect(await orm.em.fork().getConnection().execute('select id, version from vehicle order by id')).toEqual([
    { id: 1, version: 2 },
    { id: 2, version: 2 },
  ]);
  expect([c1.version, c2.version]).toEqual([2, 2]);
});
