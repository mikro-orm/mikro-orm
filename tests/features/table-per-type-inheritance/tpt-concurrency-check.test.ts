import { MikroORM, OptimisticLockError } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { mockLogger } from '../../bootstrap.js';

// concurrency check on the root
@Entity({ inheritance: 'tpt' })
abstract class Animal {
  @PrimaryKey()
  id!: number;

  @Property({ concurrencyCheck: true })
  name!: string;
}

@Entity()
class Dog extends Animal {
  @Property()
  breed!: string;
}

// concurrency check declared below the root
@Entity({ inheritance: 'tpt' })
abstract class Bird {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

@Entity()
class Parrot extends Bird {
  @Property({ concurrencyCheck: true })
  wingspan!: number;
}

describe('TPT inheritance with a concurrency check', () => {
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

  test('updating the concurrency field on the root adds the predicate only to the root table', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Dog, dog.id);
    found.name = 'Rexy';
    found.breed = 'labrador';
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[1][0]).toMatch(
      `update \`animal\` set \`name\` = 'Rexy' where \`id\` = ${dog.id} and \`name\` = 'Rex'`,
    );
    expect(mock.mock.calls[2][0]).toMatch(`update \`dog\` set \`breed\` = 'labrador' where \`id\` = ${dog.id}`);
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(Dog, dog.id);
    expect(reloaded.name).toBe('Rexy');
    expect(reloaded.breed).toBe('labrador');
  });

  test('updating only a child-owned column without changing the concurrency field fails', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Dog, dog.id);
    found.breed = 'labrador';
    await expect(orm.em.flush()).rejects.toThrow(OptimisticLockError);
  });

  test('stale concurrency field on the root is rejected', async () => {
    const dog = orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Dog, dog.id);
    await orm.em.nativeUpdate(Animal, dog.id, { name: 'Rover' });
    found.name = 'Rexy';
    found.breed = 'labrador';
    await expect(orm.em.flush()).rejects.toThrow(OptimisticLockError);
  });

  test('batched update adds the predicate only to the root table', async () => {
    orm.em.create(Dog, { name: 'Rex', breed: 'poodle' });
    orm.em.create(Dog, { name: 'Fido', breed: 'poodle' });
    await orm.em.flush();
    orm.em.clear();

    const all = await orm.em.find(Dog, {}, { orderBy: { id: 'asc' } });
    all.forEach(dog => {
      dog.name += '!';
      dog.breed = 'labrador';
    });
    const [id1, id2] = all.map(dog => dog.id);
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[1][0]).toMatch(
      `select \`a0\`.\`id\`, \`a0\`.\`name\` from \`animal\` as \`a0\` where ((\`a0\`.\`id\` = ${id1} and \`a0\`.\`name\` = 'Rex') or (\`a0\`.\`id\` = ${id2} and \`a0\`.\`name\` = 'Fido'))`,
    );
    expect(mock.mock.calls[2][0]).toMatch(
      `update \`animal\` set \`name\` = case when (\`id\` = ${id1}) then 'Rex!' when (\`id\` = ${id2}) then 'Fido!' else \`name\` end where (\`id\`, \`name\`) in ((${id1}, 'Rex'), (${id2}, 'Fido'))`,
    );
    expect(mock.mock.calls[3][0]).toMatch(
      `update \`dog\` set \`breed\` = case when (\`id\` = ${id1}) then 'labrador' when (\`id\` = ${id2}) then 'labrador' else \`breed\` end where \`id\` in (${id1}, ${id2})`,
    );
    orm.em.clear();

    const reloaded = await orm.em.find(Dog, {}, { orderBy: { id: 'asc' } });
    expect(reloaded.map(dog => dog.name)).toEqual(['Rex!', 'Fido!']);
    expect(reloaded.map(dog => dog.breed)).toEqual(['labrador', 'labrador']);
  });

  test('concurrency field declared below the root adds the predicate only to that table', async () => {
    const parrot = orm.em.create(Parrot, { name: 'Polly', wingspan: 30 });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Parrot, parrot.id);
    found.name = 'Hector';
    found.wingspan = 35;
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[1][0]).toMatch(`update \`bird\` set \`name\` = 'Hector' where \`id\` = ${parrot.id}`);
    expect(mock.mock.calls[2][0]).toMatch(
      `update \`parrot\` set \`wingspan\` = 35 where \`id\` = ${parrot.id} and \`wingspan\` = 30`,
    );
    orm.em.clear();

    const reloaded = await orm.em.findOneOrFail(Parrot, parrot.id);
    expect(reloaded.name).toBe('Hector');
    expect(reloaded.wingspan).toBe(35);
  });

  test('batched update adds the predicate only to the table declaring the concurrency field', async () => {
    orm.em.create(Parrot, { name: 'Polly', wingspan: 30 });
    orm.em.create(Parrot, { name: 'Hector', wingspan: 40 });
    await orm.em.flush();
    orm.em.clear();

    const all = await orm.em.find(Parrot, {}, { orderBy: { id: 'asc' } });
    all.forEach(parrot => {
      parrot.name += '!';
      parrot.wingspan += 1;
    });
    const [id1, id2] = all.map(parrot => parrot.id);
    const mock = mockLogger(orm);
    await orm.em.flush();
    expect(mock.mock.calls[1][0]).toMatch(
      `update \`bird\` set \`name\` = case when (\`id\` = ${id1}) then 'Polly!' when (\`id\` = ${id2}) then 'Hector!' else \`name\` end where \`id\` in (${id1}, ${id2})`,
    );
    expect(mock.mock.calls[2][0]).toMatch(
      `select \`b1\`.\`id\`, \`p0\`.\`wingspan\` from \`parrot\` as \`p0\` inner join \`bird\` as \`b1\` on \`p0\`.\`id\` = \`b1\`.\`id\` where ((\`b1\`.\`id\` = ${id1} and \`p0\`.\`wingspan\` = 30) or (\`b1\`.\`id\` = ${id2} and \`p0\`.\`wingspan\` = 40))`,
    );
    expect(mock.mock.calls[3][0]).toMatch(
      `update \`parrot\` set \`wingspan\` = case when (\`id\` = ${id1}) then 31 when (\`id\` = ${id2}) then 41 else \`wingspan\` end where (\`id\`, \`wingspan\`) in ((${id1}, 30), (${id2}, 40))`,
    );
    orm.em.clear();

    const reloaded = await orm.em.find(Parrot, {}, { orderBy: { id: 'asc' } });
    expect(reloaded.map(parrot => parrot.name)).toEqual(['Polly!', 'Hector!']);
    expect(reloaded.map(parrot => parrot.wingspan)).toEqual([31, 41]);
  });

  test('updating only a root-owned column without changing the concurrency field below the root fails', async () => {
    const parrot = orm.em.create(Parrot, { name: 'Polly', wingspan: 30 });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Parrot, parrot.id);
    found.name = 'Hector';
    await expect(orm.em.flush()).rejects.toThrow(OptimisticLockError);
  });

  test('stale concurrency field below the root is rejected', async () => {
    const parrot = orm.em.create(Parrot, { name: 'Polly', wingspan: 30 });
    await orm.em.flush();
    orm.em.clear();

    const found = await orm.em.findOneOrFail(Parrot, parrot.id);
    await orm.em.nativeUpdate(Parrot, parrot.id, { wingspan: 31 });
    found.wingspan = 35;
    await expect(orm.em.flush()).rejects.toThrow(OptimisticLockError);
  });
});
