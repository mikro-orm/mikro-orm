import { MikroORM, OptimisticLockError, OptionalProps } from '@mikro-orm/mysql';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity({ inheritance: 'tpt' })
abstract class Animal {
  [OptionalProps]?: 'version';

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ version: true })
  version!: number;
}

@Entity()
class Dog extends Animal {
  @Property()
  breed!: string;
}

@Entity({ inheritance: 'tpt' })
abstract class Bird {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Parrot extends Bird {
  [OptionalProps]?: 'version';

  @Property({ version: true })
  version!: number;

  @Property()
  wingspan!: number;
}

// covers the version reload path of drivers without `returning`
describe('TPT inheritance with a version property (mysql)', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: 'mikro_orm_test_tpt_version',
      port: 3308,
      entities: [Animal, Dog, Bird, Parrot],
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.schema.drop();
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.clear();
  });

  test('updating a child-owned column bumps the version on the declaring table', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Dog, dog.id);
    found.breed = 'labrador';
    await orm.em.flush();
    expect(found.version).toBe(2);
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(Dog, dog.id);
    expect(reloaded.breed).toBe('labrador');
    expect(reloaded.version).toBe(2);
  });

  test('batched update of a child-owned column bumps the version on the declaring table', async () => {
    orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    orm.em.create(Dog, { name: 'Fido', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const all = await orm.em.find(Dog, {});
    all.forEach(dog => (dog.breed = 'labrador'));
    await orm.em.flush();
    expect(all.map(dog => dog.version)).toEqual([2, 2]);
    orm.em.clear();

    const reloaded = await orm.em.find(Dog, {}, { orderBy: { id: 'asc' } });
    expect(reloaded.map(dog => dog.version)).toEqual([2, 2]);
  });

  test('updating a root-owned column bumps the version when it is declared below the root', async () => {
    const parrot = orm.em.create(Parrot, { name: 'Polly', wingspan: 30 });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Parrot, parrot.id);
    found.name = 'Hector';
    await orm.em.flush();
    expect(found.version).toBe(2);
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(Parrot, parrot.id);
    expect(reloaded.name).toBe('Hector');
    expect(reloaded.version).toBe(2);
  });

  test('stale version is rejected when it is declared below the root', async () => {
    const parrot = orm.em.create(Parrot, { name: 'Polly', wingspan: 30 });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Parrot, parrot.id);
    await orm.em.nativeUpdate(Parrot, parrot.id, { wingspan: 31 });
    found.name = 'Hector';
    await expect(orm.em.flush()).rejects.toThrow(OptimisticLockError);
  });
});
