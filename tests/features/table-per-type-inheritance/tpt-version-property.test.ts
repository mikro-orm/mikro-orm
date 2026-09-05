import { MikroORM, OptimisticLockError, OptionalProps } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../bootstrap.js';

// version property on the root
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

// version property declared below the root
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

describe('TPT inheritance with a version property', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: ':memory:',
      entities: [Animal, Dog, Bird, Parrot],
    });
    await orm.schema.create();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(async () => {
    await orm.schema.clear();
    orm.em.clear();
  });

  test('updating a root-owned column bumps the version', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Dog, dog.id);
    found.name = 'Rexy';
    await orm.em.flush();
    expect(found.version).toBe(2);
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(Dog, dog.id);
    expect(reloaded.name).toBe('Rexy');
    expect(reloaded.version).toBe(2);
  });

  test('updating a child-owned column bumps the version on the declaring table', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Dog, dog.id);
    found.breed = 'labrador';
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[1][0]).toMatch(
      `update \`animal\` set \`version\` = \`version\` + 1 where \`id\` = ${dog.id} and \`version\` = 1 returning \`version\``,
    );
    expect(mock.mock.calls[2][0]).toMatch(`update \`dog\` set \`breed\` = 'labrador' where \`id\` = ${dog.id}`);
    expect(found.version).toBe(2);
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(Dog, dog.id);
    expect(reloaded.breed).toBe('labrador');
    expect(reloaded.version).toBe(2);
  });

  test('updating root-owned and child-owned columns in one flush bumps the version once', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Dog, dog.id);
    found.name = 'Rexy';
    found.breed = 'labrador';
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[1][0]).toMatch(
      `update \`animal\` set \`name\` = 'Rexy', \`version\` = \`version\` + 1 where \`id\` = ${dog.id} and \`version\` = 1 returning \`version\``,
    );
    expect(mock.mock.calls[2][0]).toMatch(`update \`dog\` set \`breed\` = 'labrador' where \`id\` = ${dog.id}`);
    expect(found.version).toBe(2);
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(Dog, dog.id);
    expect(reloaded.name).toBe('Rexy');
    expect(reloaded.breed).toBe('labrador');
    expect(reloaded.version).toBe(2);
  });

  test('updating a child-owned column still enforces the optimistic lock', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Dog, dog.id);
    await orm.em.nativeUpdate(Animal, dog.id, { name: 'Rover' });
    found.breed = 'labrador';
    await expect(orm.em.flush()).rejects.toThrow(OptimisticLockError);
  });

  test('batched update of a child-owned column bumps the version on the declaring table', async () => {
    orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    orm.em.create(Dog, { name: 'Fido', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const all = await orm.em.find(Dog, {}, { orderBy: { id: 'asc' } });
    all.forEach(dog => (dog.breed = 'labrador'));
    const [id1, id2] = all.map(dog => dog.id);
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[1][0]).toMatch('select `a0`.`id` from `animal` as `a0` where');
    expect(mock.mock.calls[2][0]).toMatch(
      `update \`animal\` set \`version\` = \`version\` + 1 where \`id\` in (${id1}, ${id2}) returning \`id\`, \`version\``,
    );
    expect(mock.mock.calls[3][0]).toMatch(
      `update \`dog\` set \`breed\` = case when (\`id\` = ${id1}) then 'labrador' when (\`id\` = ${id2}) then 'labrador' else \`breed\` end where \`id\` in (${id1}, ${id2}) returning \`id\``,
    );
    expect(all.map(dog => dog.version)).toEqual([2, 2]);
    orm.em.clear();

    const reloaded = await orm.em.find(Dog, {}, { orderBy: { id: 'asc' } });
    expect(reloaded.map(dog => dog.breed)).toEqual(['labrador', 'labrador']);
    expect(reloaded.map(dog => dog.version)).toEqual([2, 2]);
  });

  test('batched update of a root-owned column bumps the version', async () => {
    orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    orm.em.create(Dog, { name: 'Fido', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const all = await orm.em.find(Dog, {});
    all.forEach(dog => (dog.name = 'Rover'));
    await orm.em.flush();
    expect(all.map(dog => dog.version)).toEqual([2, 2]);
    orm.em.clear();

    const reloaded = await orm.em.find(Dog, {}, { orderBy: { id: 'asc' } });
    expect(reloaded.map(dog => dog.version)).toEqual([2, 2]);
  });

  test('batched update bumps the version when it is declared below the root', async () => {
    orm.em.create(Parrot, { name: 'Polly', wingspan: 30 });
    orm.em.create(Parrot, { name: 'Hector', wingspan: 32 });
    await orm.em.flush();
    orm.em.clear();

    const all = await orm.em.find(Parrot, {});
    all.forEach(parrot => (parrot.wingspan = 35));
    await orm.em.flush();
    expect(all.map(parrot => parrot.version)).toEqual([2, 2]);
    orm.em.clear();

    const reloaded = await orm.em.find(Parrot, {}, { orderBy: { id: 'asc' } });
    expect(reloaded.map(parrot => parrot.version)).toEqual([2, 2]);
  });

  test('updating a root-owned column bumps the version when it is declared below the root', async () => {
    const parrot = orm.em.create(Parrot, { name: 'Polly', wingspan: 30 });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Parrot, parrot.id);
    found.name = 'Hector';
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[1][0]).toMatch(`update \`bird\` set \`name\` = 'Hector' where \`id\` = ${parrot.id}`);
    expect(mock.mock.calls[2][0]).toMatch(
      `update \`parrot\` set \`version\` = \`version\` + 1 where \`id\` = ${parrot.id} and \`version\` = 1 returning \`version\``,
    );
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
