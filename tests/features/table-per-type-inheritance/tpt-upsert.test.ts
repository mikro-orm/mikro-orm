import { MikroORM, OptionalProps, Utils, type IDatabaseDriver } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { mockLogger, PLATFORMS } from '../../bootstrap.js';

@Entity({ inheritance: 'tpt' })
abstract class Animal {
  [OptionalProps]?: 'version';

  @PrimaryKey()
  id!: number;

  @Property()
  @Unique()
  name!: string;

  @Property({ version: true })
  version!: number;
}

@Entity()
class Dog extends Animal {
  @Property()
  breed!: string;
}

@Entity()
class Puppy extends Dog {
  @Property()
  @Unique()
  tag!: string;

  @Property({ nullable: true })
  toy?: string;
}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_tpt_upsert', port: 3308 },
  postgresql: { dbName: 'mikro_orm_tpt_upsert' },
};

describe.each(Utils.keys(options))('TPT upsert [%s]', type => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init<IDatabaseDriver>({
      entities: [Animal, Dog, Puppy],
      driver: PLATFORMS[type],
      metadataProvider: ReflectMetadataProvider,
      ...options[type],
    });
    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('em.upsert(Type, data) with PK inserts and then updates every table', async () => {
    const dog = await orm.em.upsert(Dog, { id: 1, name: 'Rex', breed: 'poodle' });
    expect(dog).toBeInstanceOf(Dog);
    expect(dog.version).toBe(1);
    orm.em.clear();

    const updated = await orm.em.upsert(Dog, { id: 1, name: 'Rexy', breed: 'labrador' });
    expect(updated.name).toBe('Rexy');
    expect(updated.breed).toBe('labrador');
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Dog, 1);
    expect(found.name).toBe('Rexy');
    expect(found.breed).toBe('labrador');
    expect(await orm.em.count(Animal)).toBe(1);
  });

  test('em.upsert(Type, data) with a unique root column resolves the PK for the child table', async () => {
    const dog = await orm.em.upsert(Dog, { name: 'Rex', breed: 'poodle' });
    expect(dog.id).toBeDefined();
    orm.em.clear();

    const updated = await orm.em.upsert(Dog, { name: 'Rex', breed: 'labrador' });
    expect(updated.id).toBe(dog.id);
    expect(updated.breed).toBe('labrador');
    orm.em.clear();

    const all = await orm.em.find(Dog, {});
    expect(all).toHaveLength(1);
    expect(all[0].breed).toBe('labrador');
  });

  test('em.upsert(entity)', async () => {
    const dog = orm.em.create(Dog, { id: 1, name: 'Rex', breed: 'poodle' });
    await orm.em.upsert(dog);
    orm.em.clear();

    const dog2 = orm.em.create(Dog, { id: 1, name: 'Rexy', breed: 'labrador' });
    await orm.em.upsert(dog2);
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Dog, 1);
    expect(found.name).toBe('Rexy');
    expect(found.breed).toBe('labrador');
  });

  test('em.upsertMany(Type, data) with PK', async () => {
    await orm.em.upsertMany(Dog, [
      { id: 1, name: 'Rex', breed: 'poodle' },
      { id: 2, name: 'Fido', breed: 'poodle' },
    ]);
    orm.em.clear();

    const dogs = await orm.em.upsertMany(Dog, [
      { id: 1, name: 'Rex', breed: 'labrador' },
      { id: 2, name: 'Fido', breed: 'labrador' },
      { id: 3, name: 'Spot', breed: 'beagle' },
    ]);
    expect(dogs.map(d => d.breed)).toEqual(['labrador', 'labrador', 'beagle']);
    orm.em.clear();

    const found = await orm.em.find(Dog, {}, { orderBy: { id: 'asc' } });
    expect(found.map(d => [d.name, d.breed])).toEqual([
      ['Rex', 'labrador'],
      ['Fido', 'labrador'],
      ['Spot', 'beagle'],
    ]);
  });

  test('em.upsertMany(Type, data) with a unique root column', async () => {
    const created = await orm.em.upsertMany(Dog, [
      { name: 'Rex', breed: 'poodle' },
      { name: 'Fido', breed: 'poodle' },
    ]);
    expect(created[0].id).not.toBe(created[1].id);
    orm.em.clear();

    const dogs = await orm.em.upsertMany(Dog, [
      { name: 'Rex', breed: 'labrador' },
      { name: 'Spot', breed: 'beagle' },
    ]);
    expect(dogs[0].id).toBe(created[0].id);
    expect(dogs[1].id).toBeGreaterThan(created[1].id);
    orm.em.clear();

    const found = await orm.em.find(Dog, {}, { orderBy: { id: 'asc' } });
    expect(found.map(d => [d.name, d.breed])).toEqual([
      ['Rex', 'labrador'],
      ['Fido', 'poodle'],
      ['Spot', 'beagle'],
    ]);
  });

  test('em.upsert(Type, data) with onConflictAction ignore keeps the existing row in every table', async () => {
    await orm.em.upsert(Dog, { id: 1, name: 'Rex', breed: 'poodle' });
    orm.em.clear();

    const dog = await orm.em.upsert(Dog, { id: 1, name: 'Rexy', breed: 'labrador' }, { onConflictAction: 'ignore' });
    expect(dog.name).toBe('Rex');
    expect(dog.breed).toBe('poodle');
  });

  test('three level hierarchy upserts each table once', async () => {
    const mock = mockLogger(orm);
    await orm.em.upsert(Puppy, { id: 1, name: 'Rex', breed: 'poodle', tag: 'A1' });
    const inserts = mock.mock.calls.map(c => c[0]).filter(q => q.includes('insert into'));
    expect(inserts).toHaveLength(3);
    expect(inserts[0]).toMatch(/insert into .animal./);
    expect(inserts[1]).toMatch(/insert into .dog./);
    expect(inserts[2]).toMatch(/insert into .puppy./);
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Puppy, 1);
    expect(found).toMatchObject({ name: 'Rex', breed: 'poodle', tag: 'A1' });
  });
});
