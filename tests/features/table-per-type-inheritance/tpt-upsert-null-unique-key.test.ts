import { MikroORM, Utils, type IDatabaseDriver } from '@mikro-orm/core';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';
import { PLATFORMS } from '../../bootstrap.js';

@Entity({ inheritance: 'tpt' })
abstract class Person {
  @PrimaryKey({ fieldName: 'person_id' })
  id!: number;

  @Property({ nullable: true })
  @Unique()
  email?: string | null;
}

@Entity()
class Employee extends Person {
  @Property()
  department!: string;

  @Property({ onCreate: () => 'new' })
  status?: string;
}

@Entity()
class Manager extends Employee {
  @Property()
  level!: number;
}

const options = {
  sqlite: { dbName: ':memory:' },
  mysql: { dbName: 'mikro_orm_tpt_upsert_null_unique', port: 3308 },
  postgresql: { dbName: 'mikro_orm_tpt_upsert_null_unique' },
};

const variants = [...Utils.keys(options).map(type => [type, true] as const), ['sqlite', false] as const];

describe.each(variants)(
  'TPT upsert with a null unique key in the parent table [%s, returning: %s]',
  (type, returning) => {
    let orm: MikroORM;

    beforeAll(async () => {
      orm = await MikroORM.init<IDatabaseDriver>({
        entities: [Person, Employee, Manager],
        driver: PLATFORMS[type],
        metadataProvider: ReflectMetadataProvider,
        ...options[type],
      });
      await orm.schema.refresh();

      if (!returning) {
        vi.spyOn(orm.em.getPlatform(), 'usesReturningStatement').mockReturnValue(false);
      }
    });

    beforeEach(async () => {
      await orm.schema.clear();
      orm.em.clear();
    });

    afterAll(() => orm.close(true));

    async function seed() {
      const existing = await orm.em.upsert(Employee, { email: 'existing@example.com', department: 'sales' });
      orm.em.clear();

      return existing.id;
    }

    async function expectRows(rows: [number, string | null, string][]) {
      orm.em.clear();
      const found = await orm.em.find(Employee, {}, { orderBy: { id: 'asc' } });
      expect(found.map(e => [e.id, e.email, e.department])).toEqual(rows);
    }

    test('em.upsert() inserts a new row instead of targeting an unrelated one', async () => {
      const existingId = await seed();

      const created = await orm.em.upsert(Employee, { email: null, department: 'support' });
      expect(created.id).toBeGreaterThan(existingId);
      expect(created.email).toBeNull();
      expect(created.department).toBe('support');

      await expectRows([
        [existingId, 'existing@example.com', 'sales'],
        [created.id, null, 'support'],
      ]);
    });

    test('em.upsert() inserts a new row when the unique key is not provided', async () => {
      const existingId = await seed();

      const created = await orm.em.upsert(Employee, { department: 'support' });
      expect(created.id).toBeGreaterThan(existingId);
      expect(created.department).toBe('support');

      await expectRows([
        [existingId, 'existing@example.com', 'sales'],
        [created.id, null, 'support'],
      ]);
    });

    test('em.upsertMany() inserts new rows instead of targeting an unrelated one', async () => {
      const existingId = await seed();

      const created = await orm.em.upsertMany(Employee, [
        { email: null, department: 'support' },
        { email: null, department: 'legal' },
      ]);
      expect(created.map(e => e.department)).toEqual(['support', 'legal']);
      expect(created[0].id).toBeGreaterThan(existingId);
      expect(created[1].id).toBeGreaterThan(created[0].id);

      await expectRows([
        [existingId, 'existing@example.com', 'sales'],
        [created[0].id, null, 'support'],
        [created[1].id, null, 'legal'],
      ]);
    });

    test('em.upsertMany() with rows both with and without the unique key', async () => {
      const existingId = await seed();

      const first = await orm.em.upsertMany(Employee, [
        { email: 'existing@example.com', department: 'marketing' },
        { email: null, department: 'support' },
      ]);
      expect(first.map(e => [e.id, e.email, e.department])).toEqual([
        [existingId, 'existing@example.com', 'marketing'],
        [first[1].id, null, 'support'],
      ]);
      expect(first[1].id).toBeGreaterThan(existingId);
      orm.em.clear();

      const second = await orm.em.upsertMany(Employee, [
        { email: null, department: 'legal' },
        { email: 'existing@example.com', department: 'sales' },
        { email: 'new@example.com', department: 'finance' },
      ]);
      expect(second.map(e => [e.email, e.department])).toEqual([
        [null, 'legal'],
        ['existing@example.com', 'sales'],
        ['new@example.com', 'finance'],
      ]);
      expect(second[1].id).toBe(existingId);
      expect(new Set([existingId, first[1].id, second[0].id, second[2].id]).size).toBe(4);

      const rows: [number, string | null, string][] = [
        [existingId, 'existing@example.com', 'sales'],
        [first[1].id, null, 'support'],
        [second[0].id, null, 'legal'],
        [second[2].id, 'new@example.com', 'finance'],
      ];
      await expectRows(rows.sort((a, b) => a[0] - b[0]));
      expect(await orm.em.count(Person)).toBe(4);
    });

    test('em.upsertMany() returns the inserted row when others share its null unique key', async () => {
      const existingId = await seed();
      const old = await orm.em.upsertMany(Employee, [
        { email: null, department: 'support' },
        { email: null, department: 'legal' },
      ]);
      orm.em.clear();

      const created = await orm.em.upsertMany(Employee, [
        { email: 'existing@example.com', department: 'marketing' },
        { email: null, department: 'finance' },
      ]);
      expect(created.map(e => [e.email, e.department])).toEqual([
        ['existing@example.com', 'marketing'],
        [null, 'finance'],
      ]);
      expect(created[0].id).toBe(existingId);
      expect(created[1].id).toBeGreaterThan(old[1].id);

      await expectRows([
        [existingId, 'existing@example.com', 'marketing'],
        [old[0].id, null, 'support'],
        [old[1].id, null, 'legal'],
        [created[1].id, null, 'finance'],
      ]);
    });

    test('em.upsertMany() with entity instances', async () => {
      const existingId = await seed();

      const created = [
        orm.em.create(Employee, { email: null, department: 'support' }, { persist: false }),
        orm.em.create(Employee, { email: null, department: 'legal' }, { persist: false }),
      ];
      await orm.em.upsertMany(created);
      expect(created[0].id).toBeGreaterThan(existingId);
      expect(created[1].id).toBeGreaterThan(created[0].id);
      expect(created.map(e => e.department)).toEqual(['support', 'legal']);

      await expectRows([
        [existingId, 'existing@example.com', 'sales'],
        [created[0].id, null, 'support'],
        [created[1].id, null, 'legal'],
      ]);
    });

    test('em.upsert() with an entity instance', async () => {
      const existingId = await seed();

      const created = orm.em.create(Employee, { email: null, department: 'support' }, { persist: false });
      await orm.em.upsert(created);
      expect(created.id).toBeGreaterThan(existingId);

      await expectRows([
        [existingId, 'existing@example.com', 'sales'],
        [created.id, null, 'support'],
      ]);
    });

    test('em.upsert() in a three level hierarchy', async () => {
      const existing = await orm.em.upsert(Manager, { email: 'existing@example.com', department: 'sales', level: 1 });
      orm.em.clear();

      const created = await orm.em.upsert(Manager, { email: null, department: 'support', level: 2 });
      expect(created.id).toBeGreaterThan(existing.id);
      orm.em.clear();

      const found = await orm.em.find(Manager, {}, { orderBy: { id: 'asc' } });
      expect(found.map(e => [e.id, e.email, e.department, e.level])).toEqual([
        [existing.id, 'existing@example.com', 'sales', 1],
        [created.id, null, 'support', 2],
      ]);
    });

    test('em.upsertMany() with a mixed batch in a three level hierarchy', async () => {
      const existing = await orm.em.upsert(Manager, { email: 'existing@example.com', department: 'sales', level: 1 });
      const old = await orm.em.upsert(Manager, { email: null, department: 'support', level: 2 });
      orm.em.clear();

      const created = await orm.em.upsertMany(Manager, [
        { email: null, department: 'legal', level: 3 },
        { email: 'existing@example.com', department: 'marketing', level: 4 },
        { email: null, department: 'finance', level: 5 },
      ]);
      expect(created.map(e => [e.email, e.department, e.level])).toEqual([
        [null, 'legal', 3],
        ['existing@example.com', 'marketing', 4],
        [null, 'finance', 5],
      ]);
      expect(created[1].id).toBe(existing.id);
      expect(created[0].id).toBeGreaterThan(old.id);
      expect(created[2].id).toBeGreaterThan(created[0].id);
      orm.em.clear();

      const found = await orm.em.find(Manager, {}, { orderBy: { id: 'asc' } });
      expect(found.map(e => [e.id, e.email, e.department, e.level])).toEqual([
        [existing.id, 'existing@example.com', 'marketing', 4],
        [old.id, null, 'support', 2],
        [created[0].id, null, 'legal', 3],
        [created[2].id, null, 'finance', 5],
      ]);
    });
  },
);
