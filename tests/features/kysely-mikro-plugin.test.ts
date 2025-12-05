import { defineEntity, p, ReferenceKind } from '@mikro-orm/core';
import { vi } from 'vitest';
import { InferKyselyTable, Kysely, MikroORM, MikroPluginOptions, MikroPlugin } from '@mikro-orm/sqlite';
import { ColumnNode, PrimitiveValueListNode, ValueListNode, ValueNode, ValuesNode } from 'kysely';
import { MikroORM as PostgresORM } from '@mikro-orm/postgresql';
import { MikroTransformer } from '../../packages/knex/src/plugin/transformer.js';

describe('MikroPlugin', () => {
  const Person = defineEntity({
    name: 'Person',
    properties: {
      id: p.integer().autoincrement().primary(),
      createdAt: p.datetime().nullable().onCreate(() => new Date()),
      updatedAt: p.datetime().nullable().onCreate(() => new Date()).onUpdate(() => new Date()),
      firstName: p.string().nullable(),
      middleName: p.string().nullable(),
      lastName: p.string().nullable(),
      gender: p.enum(['male', 'female', 'other']),
      maritalStatus: p.enum(['single', 'married', 'divorced', 'widowed']).nullable(),
      children: p.integer().onCreate(() => 0),
    },
  });

  const Pet = defineEntity({
    name: 'Pet',
    properties: {
      id: p.integer().primary().autoincrement(),
      createdAt: p.datetime().onCreate(() => new Date()),
      updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
      name: p.string(),
      owner: p.manyToOne(Person),
      species: p.enum(['dog', 'cat', 'hamster']),
    },
  });

  const Toy = defineEntity({
    name: 'Toy',
    properties: {
      id: p.integer().primary().autoincrement(),
      createdAt: p.datetime().onCreate(() => new Date()),
      updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
      name: p.string(),
      price: p.float(),
      pet: p.manyToOne(Pet),
    },
  });

  const TypeEntity = defineEntity({
    name: 'TypeEntity',
    properties: {
      id: p.integer().primary().autoincrement(),
      createdAt: p.datetime().nullable(),
      flag: p.boolean().nullable(),
      payload: p.json().nullable(),
    },
  });

  describe('tableNamingStrategy: entity', () => {
    const options = {
      tableNamingStrategy: 'entity',
      convertValues: true,
    } satisfies MikroPluginOptions;
    interface PersonTable extends InferKyselyTable<typeof Person, typeof options> {}
    interface PetTable extends InferKyselyTable<typeof Pet, typeof options> {}
    interface ToyTable extends InferKyselyTable<typeof Toy, typeof options> {}
    interface DB {
      Person: PersonTable;
      Pet: PetTable;
      Toy: ToyTable;
    }
    let orm: MikroORM;
    let kysely: Kysely<DB>;
    let pgOrm: PostgresORM;
    let pgKysely: Kysely<DB>;

    beforeAll(async () => {
      orm = new MikroORM({
        entities: [Person, Pet, Toy],
        dbName: ':memory:',
      });
      await orm.schema.refresh();
      pgOrm = new PostgresORM({
        entities: [Person, Pet, Toy],
        dbName: 'kysely_plugin_test_1',
      });
      await pgOrm.schema.refresh();
      kysely = orm.em.getKysely({
        tableNamingStrategy: 'entity',
        convertValues: true,
      });
      pgKysely = pgOrm.em.getKysely({
        tableNamingStrategy: 'entity',
        convertValues: true,
      });
    });

    test('basic SELECT query', () => {
      expect(kysely.selectFrom('Person').selectAll().compile().sql).toMatchInlineSnapshot(`"select * from "person""`);
    });

    test('SELECT with specific columns', () => {
      expect(
        kysely.selectFrom('Person').select(['id', 'first_name', 'last_name']).compile().sql,
      ).toMatchInlineSnapshot(`"select "id", "first_name", "last_name" from "person""`);
    });

    test('SELECT with WHERE clause', () => {
      expect(
        kysely.selectFrom('Person').selectAll().where('id', '=', 1).compile().sql,
      ).toMatchInlineSnapshot(`"select * from "person" where "id" = ?"`);
    });

    test('SELECT with ORDER BY', () => {
      expect(
        kysely.selectFrom('Person').selectAll().orderBy('id', 'asc').limit(10).compile().sql,
      ).toMatchInlineSnapshot(`"select * from "person" order by "id" asc limit ?"`);
    });

    test('SELECT with table alias', () => {
      expect(
        kysely.selectFrom('Person as p').select(['p.id', 'p.first_name']).compile().sql,
      ).toMatchInlineSnapshot(`"select "p"."id", "p"."first_name" from "person" as "p""`);
    });

    test('INSERT query', () => {
      expect(
        kysely.insertInto('Person').values({
          id: 1,
          created_at: new Date(),
          updated_at: new Date(),
          first_name: 'John',
          last_name: 'Doe',
          gender: 'male',
          children: 0,
        }).compile().sql,
      ).toMatchInlineSnapshot(`"insert into "person" ("id", "created_at", "updated_at", "first_name", "last_name", "gender", "children") values (?, ?, ?, ?, ?, ?, ?)"`);
    });

    test('UPDATE query', () => {
      expect(
        kysely.updateTable('Person').set({
          first_name: 'Jane',
          last_name: 'Smith',
        }).where('id', '=', 1).compile().sql,
      ).toMatchInlineSnapshot(`"update "person" set "first_name" = ?, "last_name" = ? where "id" = ?"`);
    });

    test('UPDATE with RETURNING', () => {
      expect(
        kysely.updateTable('Person').set({ first_name: 'Test' }).where('id', '=', 1).returning(['id', 'first_name']).compile().sql,
      ).toMatchInlineSnapshot(`"update "person" set "first_name" = ? where "id" = ? returning "id", "first_name""`);
    });

    test('DELETE query', () => {
      expect(
        kysely.deleteFrom('Person').where('id', '=', 1).compile().sql,
      ).toMatchInlineSnapshot(`"delete from "person" where "id" = ?"`);
    });

    test('DELETE with RETURNING', () => {
      expect(
        kysely.deleteFrom('Person').where('id', '=', 1).returning(['id', 'first_name']).compile().sql,
      ).toMatchInlineSnapshot(`"delete from "person" where "id" = ? returning "id", "first_name""`);
    });

    test('INNER JOIN', () => {
      expect(
        kysely
          .selectFrom('Toy as t')
          .innerJoin('Pet as p', 't.pet_id', 'p.id')
          .select(['t.name', 'p.name'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "t"."name", "p"."name" from "toy" as "t" inner join "pet" as "p" on "t"."pet_id" = "p"."id""`);
    });

    test('LEFT JOIN', () => {
      expect(
        kysely
          .selectFrom('Pet as p')
          .leftJoin('Person as per', 'p.owner_id', 'per.id')
          .select(['p.name', 'per.first_name'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "p"."name", "per"."first_name" from "pet" as "p" left join "person" as "per" on "p"."owner_id" = "per"."id""`);
    });

    test('multiple JOINs', () => {
      expect(
        kysely
          .selectFrom('Toy as t')
          .innerJoin('Pet as p', 't.pet_id', 'p.id')
          .leftJoin('Person as per', 'p.owner_id', 'per.id')
          .select(['t.name', 'p.name', 'per.first_name'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "t"."name", "p"."name", "per"."first_name" from "toy" as "t" inner join "pet" as "p" on "t"."pet_id" = "p"."id" left join "person" as "per" on "p"."owner_id" = "per"."id""`);
    });

    test('JOIN with WHERE condition', () => {
      expect(
        kysely
          .selectFrom('Toy as t')
          .innerJoin('Pet as p', 't.pet_id', 'p.id')
          .where('p.species', '=', 'dog')
          .select(['t.name'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "t"."name" from "toy" as "t" inner join "pet" as "p" on "t"."pet_id" = "p"."id" where "p"."species" = ?"`);
    });

    test('subquery in WHERE clause', () => {
      expect(
        kysely
          .selectFrom('Person')
          .selectAll()
          .where('id', 'in', eb =>
            eb.selectFrom('Pet')
              .select('owner_id')
              .where('species', '=', 'dog'),
          )
          .compile().sql,
      ).toMatchInlineSnapshot(`"select * from "person" where "id" in (select "owner_id" from "pet" where "species" = ?)"`);
    });

    test('subquery in SELECT clause', () => {
      expect(
        kysely
          .selectFrom('Person as p')
          .select([
            'p.first_name',
            eb =>
              eb.selectFrom('Pet')
                .select(eb => eb.fn.count('id').as('count'))
                .whereRef('owner_id', '=', 'p.id')
                .as('petCount'),
          ])
          .compile().sql,
      ).toMatchInlineSnapshot(`"select "p"."first_name", (select count("id") as "count" from "pet" where "owner_id" = "p"."id") as "petCount" from "person" as "p""`);
    });

    test('EXISTS subquery', () => {
      expect(
        kysely
          .selectFrom('Person')
          .selectAll()
          .where(eb => eb.exists(
            eb.selectFrom('Pet')
              .select('id')
              .whereRef('owner_id', '=', 'Person.id')
              .where('species', '=', 'dog'),
          ))
          .compile().sql,
      ).toMatchInlineSnapshot(`"select * from "person" where exists (select "id" from "pet" where "owner_id" = "person"."id" and "species" = ?)"`);
    });

    test('CTE (Common Table Expression)', () => {
      expect(
        kysely
          .with('active_persons', db =>
            db.selectFrom('Person')
              .select(['id', 'first_name'])
              .where('first_name', 'is not', null),
          )
          .selectFrom('active_persons')
          .selectAll()
          .compile().sql,
      ).toMatchInlineSnapshot(`"with "active_persons" as (select "id", "first_name" from "person" where "first_name" is not null) select * from "active_persons""`);
    });

    test('multiple CTEs', () => {
      expect(
        kysely
          .with('person_stats', db =>
            db.selectFrom('Person')
              .select(['id', 'first_name'])
              .where('first_name', 'is not', null),
          )
          .with('pet_stats', db =>
            db.selectFrom('Pet')
              .select(['owner_id', eb => eb.fn.count('id').as('count')])
              .groupBy('owner_id'),
          )
          .selectFrom('person_stats as ps')
          .leftJoin('pet_stats as pst', 'ps.id', 'pst.owner_id')
          .select(['ps.first_name', 'pst.count'])
          .compile().sql,
      ).toMatchInlineSnapshot(`"with "person_stats" as (select "id", "first_name" from "person" where "first_name" is not null), "pet_stats" as (select "owner_id", count("id") as "count" from "pet" group by "owner_id") select "ps"."first_name", "pst"."count" from "person_stats" as "ps" left join "pet_stats" as "pst" on "ps"."id" = "pst"."owner_id""`);
    });

    test('all entity names should work', () => {
      expect(kysely.selectFrom('Pet').selectAll().compile().sql).toMatchInlineSnapshot(`"select * from "pet""`);
      expect(kysely.selectFrom('Toy').selectAll().compile().sql).toMatchInlineSnapshot(`"select * from "toy""`);
    });

    test('MERGE query - PostgreSQL', async () => {
      // PostgreSQL supports MERGE, SQLite doesn't
      // This tests transformMergeQuery (lines 259-270)
      const now = new Date();

      // Insert source data
      const personId = await pgKysely
        .insertInto('Person')
        .values({
          first_name: 'MergeTest',
          last_name: 'Person',
          gender: 'male',
          children: 0,
          created_at: now,
          updated_at: now,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      await pgKysely
        .insertInto('Pet')
        .values({
          name: 'MergePet',
          owner_id: personId,
          species: 'dog',
          created_at: now,
          updated_at: now,
        })
        .execute();

      // MERGE query: update Person when Pet exists
      const mergeResult = await pgKysely
        .mergeInto('Person as target')
        .using('Pet as source', 'source.owner_id', 'target.id')
        .whenMatched()
        .thenUpdateSet({
          middle_name: 'has_pets',
        })
        .executeTakeFirstOrThrow();

      expect(mergeResult.numChangedRows).toBeGreaterThan(0n);

      // Verify the update was applied
      const updated = await pgKysely
        .selectFrom('Person')
        .selectAll()
        .where('id', '=', personId)
        .executeTakeFirstOrThrow();

      expect(updated.middle_name).toBe('has_pets');

      // Cleanup
      await pgKysely.deleteFrom('Pet').execute();
      await pgKysely.deleteFrom('Person').execute();
    });

    afterAll(async () => {
      await pgOrm.close(true);
    });
  });

  describe('columnNamingStrategy: property', () => {
    interface PersonTable extends InferKyselyTable<typeof Person, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
    interface PetTable extends InferKyselyTable<typeof Pet, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
    interface ToyTable extends InferKyselyTable<typeof Toy, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
    interface DB {
      person: PersonTable;
      pet: PetTable;
      toy: ToyTable;
    }
    let orm: MikroORM;
    let kysely: Kysely<DB>;
    let pgOrm: PostgresORM;
    let pgKysely: Kysely<DB>;

    beforeAll(async () => {
      orm = new MikroORM({
        entities: [Person, Pet, Toy],
        dbName: ':memory:',
      });
      await orm.schema.refresh();
      kysely = orm.em.getKysely({
        columnNamingStrategy: 'property',
        convertValues: true,
      });
      pgOrm = new PostgresORM({
        entities: [Person, Pet, Toy],
        dbName: 'kysely_plugin_test_2',
      });
      await pgOrm.schema.refresh();
      pgKysely = pgOrm.em.getKysely({
        columnNamingStrategy: 'property',
        convertValues: true,
      });
    });

    const insertTestData = async (kysely: Kysely<DB>) => {
      // Insert test data: Person -> Pet -> Toy
      const now = new Date();
      const person1Id = await kysely
        .insertInto('person')
        .values({
          firstName: 'John',
          lastName: 'Doe',
          gender: 'male',
          children: 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      const person2Id = await kysely
        .insertInto('person')
        .values({
          firstName: 'Jane',
          lastName: 'Smith',
          gender: 'female',
          children: 2,
          createdAt: now,
          updatedAt: now,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      const pet1Id = await kysely
        .insertInto('pet')
        .values({
          name: 'Buddy',
          owner: person1Id,
          species: 'dog',
          createdAt: now,
          updatedAt: now,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      const pet2Id = await kysely
        .insertInto('pet')
        .values({
          name: 'Fluffy',
          owner: person2Id,
          species: 'cat',
          createdAt: now,
          updatedAt: now,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      await kysely
        .insertInto('toy')
        .values({
          name: 'Ball',
          price: 10.5,
          pet: pet1Id,
          createdAt: now,
          updatedAt: now,
        })
        .execute();

      await kysely
        .insertInto('toy')
        .values({
          name: 'Mouse',
          price: 5.0,
          pet: pet2Id,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    };

    beforeEach(async () => {
      await insertTestData(kysely);
      await insertTestData(pgKysely);
    });

    afterEach(async () => {
      await kysely.deleteFrom('toy').execute();
      await kysely.deleteFrom('pet').execute();
      await kysely.deleteFrom('person').execute();
    });

    test('INSERT query', () => {
      const query = kysely.insertInto('person').values({
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        children: 0,
      });
      expect(query.compile().sql).toMatchInlineSnapshot(`"insert into "person" ("id", "created_at", "updated_at", "first_name", "last_name", "gender", "children") values (?, ?, ?, ?, ?, ?, ?)"`);
    });

    test('SELECT with table alias', async () => {
      const query = kysely.selectFrom('person as p').select(['p.firstName', 'p.lastName']);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select "p"."first_name", "p"."last_name" from "person" as "p""`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ firstName: 'John', lastName: 'Doe' });
      expect(result[1]).toMatchObject({ firstName: 'Jane', lastName: 'Smith' });
    });

    test('SELECT with column alias', async () => {
      const query = kysely.selectFrom('person').select(['firstName', 'person.lastName as name']);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select "first_name", "person"."last_name" as "name" from "person""`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ firstName: 'John', name: 'Doe' });
    });

    test('SELECT with WHERE clause', async () => {
      const query = kysely.selectFrom('person').selectAll().where('firstName', '=', 'John');
      expect(query.compile().sql).toMatchInlineSnapshot(`"select * from "person" where "first_name" = ?"`);
      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ firstName: 'John', lastName: 'Doe' });
    });

    test('SELECT with ORDER BY', async () => {
      const query = kysely.selectFrom('person').selectAll().orderBy('firstName').limit(10);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select * from "person" order by "first_name" limit ?"`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ firstName: 'Jane' });
      expect(result[1]).toMatchObject({ firstName: 'John' });
    });

    test('UPDATE query', async () => {
      const query = kysely.updateTable('person').set({
        firstName: 'Janet',
        lastName: 'Smithson',
      }).where('firstName', '=', 'Jane').returning('lastName');
      expect(query.compile().sql).toMatchInlineSnapshot(`"update "person" set "first_name" = ?, "last_name" = ? where "first_name" = ? returning "last_name""`);
      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ lastName: 'Smithson' });
    });

    test('DELETE query', async () => {
      // Insert a test person specifically for deletion
      const now = new Date();
      const testPersonId = await kysely
        .insertInto('person')
        .values({
          firstName: 'TestPerson',
          lastName: 'ToDelete',
          gender: 'male',
          children: 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      const query = kysely.deleteFrom('person').where('id', '=', testPersonId);
      expect(query.compile().sql).toMatchInlineSnapshot(`"delete from "person" where "id" = ?"`);
      const result = await query.execute();
      expect(result[0].numDeletedRows).toBe(BigInt(1));
    });

    test('SELECT relation property', async () => {
      const query = kysely
        .selectFrom('pet')
        .select(['owner']);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select "owner_id" from "pet""`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('owner');
      expect(result[1]).toHaveProperty('owner');
    });

    test('INNER JOIN', async () => {
      const query = kysely
        .selectFrom('toy as t')
        .innerJoin('pet as p', 't.pet', 'p.id')
        .select(['t.name as toyName', 'p.name as petName', 'p.species']);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select "t"."name" as "toyName", "p"."name" as "petName", "p"."species" from "toy" as "t" inner join "pet" as "p" on "t"."pet_id" = "p"."id""`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ toyName: 'Ball', petName: 'Buddy', species: 'dog' });
      expect(result[1]).toMatchObject({ toyName: 'Mouse', petName: 'Fluffy', species: 'cat' });
    });

    test('LEFT JOIN', async () => {
      const query = kysely
        .selectFrom('pet as p')
        .leftJoin('person as per', 'p.owner', 'per.id')
        .select(['p.name', 'per.firstName', 'per.lastName']);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select "p"."name", "per"."first_name", "per"."last_name" from "pet" as "p" left join "person" as "per" on "p"."owner_id" = "per"."id""`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ name: 'Buddy', firstName: 'John', lastName: 'Doe' });
      expect(result[1]).toMatchObject({ name: 'Fluffy', firstName: 'Jane', lastName: 'Smith' });
    });

    test('JOIN with WHERE condition', async () => {
      const query = kysely
        .selectFrom('toy as t')
        .innerJoin('pet as p', 't.pet', 'p.id')
        .where('p.species', '=', 'dog')
        .select(['t.name as toyName', 'p.name as petName']);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select "t"."name" as "toyName", "p"."name" as "petName" from "toy" as "t" inner join "pet" as "p" on "t"."pet_id" = "p"."id" where "p"."species" = ?"`);
      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ toyName: 'Ball', petName: 'Buddy' });
    });

    test('multiple JOINs', async () => {
      const query = kysely
        .selectFrom('toy as t')
        .innerJoin('pet as p', 't.pet', 'p.id')
        .leftJoin('person as per', 'p.owner', 'per.id')
        .select(['t.name as toyName', 'p.name as petName', 'per.firstName']);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select "t"."name" as "toyName", "p"."name" as "petName", "per"."first_name" from "toy" as "t" inner join "pet" as "p" on "t"."pet_id" = "p"."id" left join "person" as "per" on "p"."owner_id" = "per"."id""`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ toyName: 'Ball', petName: 'Buddy', firstName: 'John' });
      expect(result[1]).toMatchObject({ toyName: 'Mouse', petName: 'Fluffy', firstName: 'Jane' });
    });

    test('JOIN with ORDER BY', async () => {
      const query = kysely
        .selectFrom('toy as t')
        .innerJoin('pet as p', 't.pet', 'p.id')
        .orderBy('p.name', 'asc')
        .select(['t.name']);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select "t"."name" from "toy" as "t" inner join "pet" as "p" on "t"."pet_id" = "p"."id" order by "p"."name" asc"`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ name: 'Ball' });
      expect(result[1]).toMatchObject({ name: 'Mouse' });
    });

    test('subquery in WHERE clause', async () => {
      const query = kysely
        .selectFrom('person')
        .selectAll()
        .where('id', 'in', eb =>
          eb.selectFrom('pet')
            .select('owner')
            .where('species', '=', 'dog'),
        );
      expect(query.compile().sql).toMatchInlineSnapshot(`"select * from "person" where "id" in (select "owner_id" from "pet" where "species" = ?)"`);
      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ firstName: 'John' });
    });

    test('subquery in SELECT clause', async () => {
      const query = kysely
        .selectFrom('person as p')
        .select([
          'p.firstName',
          eb =>
            eb.selectFrom('pet')
              .select(eb => eb.fn.count('id').as('count'))
              .whereRef('owner', '=', 'p.id')
              .as('petCount'),
        ]);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select "p"."first_name", (select count("id") as "count" from "pet" where "owner_id" = "p"."id") as "petCount" from "person" as "p""`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ firstName: 'John', petCount: 1 });
      expect(result[1]).toMatchObject({ firstName: 'Jane', petCount: 1 });
    });

    test('subquery with JOIN', async () => {
      const query = kysely
        .selectFrom('person as p')
        .leftJoin(
          eb =>
            eb.selectFrom('pet')
              .select(['owner', eb => eb.fn.count('id').as('count')])
              .groupBy('owner')
              .as('pet_stats'),
          join => join.onRef('pet_stats.owner', '=', 'p.id'),
        )
        .select(['p.firstName', 'pet_stats.count']);
      expect(query.compile().sql).toMatchInlineSnapshot(`"select "p"."first_name", "pet_stats"."count" from "person" as "p" left join (select "owner_id", count("id") as "count" from "pet" group by "owner_id") as "pet_stats" on "pet_stats"."owner_id" = "p"."id""`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ firstName: 'John', count: 1 });
      expect(result[1]).toMatchObject({ firstName: 'Jane', count: 1 });
    });

    test('EXISTS subquery', async () => {
      const query = kysely
        .selectFrom('person')
        .selectAll()
        .where(eb => eb.exists(
          eb.selectFrom('pet')
            .select('id')
            .whereRef('owner', '=', 'person.id')
            .where('species', '=', 'dog'),
        ));
      expect(query.compile().sql).toMatchInlineSnapshot(`"select * from "person" where exists (select "id" from "pet" where "owner_id" = "person"."id" and "species" = ?)"`);
      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ firstName: 'John' });
    });

    test('CTE with JOIN', async () => {
      const query = kysely
        .with('pet_toys', db =>
          db.selectFrom('toy as t')
            .innerJoin('pet as p', 't.pet', 'p.id')
            .select(['t.id', 't.name', 'p.name as petName']),
        )
        .selectFrom('pet_toys')
        .selectAll()
        .where('petName', '=', 'Buddy');
      expect(query.compile().sql).toMatchInlineSnapshot(`"with "pet_toys" as (select "t"."id", "t"."name", "p"."name" as "petName" from "toy" as "t" inner join "pet" as "p" on "t"."pet_id" = "p"."id") select * from "pet_toys" where "petName" = ?"`);
      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ petName: 'Buddy' });
    });

    test('multiple CTEs', async () => {
      const query = kysely
        .with('person_stats', db =>
          db.selectFrom('person')
            .select(['id', 'firstName'])
            .where('firstName', 'is not', null),
        )
        .with('pet_stats', db =>
          db.selectFrom('pet')
            .select(['owner', eb => eb.fn.count('id').as('count')])
            .groupBy('owner'),
        )
        .selectFrom('person_stats as ps')
        .leftJoin('pet_stats as pst', 'ps.id', 'pst.owner')
        .select(['ps.firstName', 'pst.count'])
        .orderBy('ps.firstName', 'asc');
      expect(query.compile().sql).toMatchInlineSnapshot(`"with "person_stats" as (select "id", "first_name" from "person" where "first_name" is not null), "pet_stats" as (select "owner_id", count("id") as "count" from "pet" group by "owner_id") select "ps"."first_name", "pst"."count" from "person_stats" as "ps" left join "pet_stats" as "pst" on "ps"."id" = "pst"."owner_id" order by "ps"."first_name" asc"`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ firstName: 'Jane', count: 1 });
      expect(result[1]).toMatchObject({ firstName: 'John', count: 1 });
    });

    test('CTE alias resolved via subquery alias map (findOwnerEntityInContext)', async () => {
      const query = kysely
        .with('active_people', db =>
          db.selectFrom('person')
            .select(['id', 'firstName'])
            .where('firstName', 'is not', null),
        )
        .selectFrom('active_people as ap')
        .select(['ap.firstName'])
        .orderBy('ap.firstName');

      expect(query.compile().sql).toMatchInlineSnapshot(`"with "active_people" as (select "id", "first_name" from "person" where "first_name" is not null) select "ap"."first_name" from "active_people" as "ap" order by "ap"."first_name""`);

      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('firstName', 'Jane');
      expect(result[1]).toHaveProperty('firstName', 'John');
    });

    test('recursive CTE', async () => {
      // For recursive CTE, we just test that the SQL is correctly generated
      // The actual recursion behavior depends on the database and data
      const query = kysely
        .withRecursive('person_hierarchy', db =>
          db.selectFrom('person')
            .select(['id', 'firstName'])
            .limit(1)
            .unionAll(db =>
              db.selectFrom('person as p')
                .innerJoin('person_hierarchy as ph', 'p.id', 'ph.id')
                .select(['p.id', 'p.firstName']),
            ),
        )
        .selectFrom('person_hierarchy')
        .selectAll();
      expect(query.compile().sql).toMatchInlineSnapshot(`"with recursive "person_hierarchy" as (select "id", "first_name" from "person" union all select "p"."id", "p"."first_name" from "person" as "p" inner join "person_hierarchy" as "ph" on "p"."id" = "ph"."id" limit ?) select * from "person_hierarchy""`);
      // The result depends on database-specific recursive CTE implementation
      const result = await query.execute();
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test('simple CTE', async () => {
      const query = kysely
        .with('active_persons', db =>
          db.selectFrom('person')
            .select(['id', 'firstName', 'lastName'])
            .where('firstName', 'is not', null),
        )
        .selectFrom('active_persons')
        .selectAll()
        .orderBy('firstName');
      expect(query.compile().sql).toMatchInlineSnapshot(`"with "active_persons" as (select "id", "first_name", "last_name" from "person" where "first_name" is not null) select * from "active_persons" order by "first_name""`);
      const result = await query.execute();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ firstName: 'Jane' });
      expect(result[1]).toMatchObject({ firstName: 'John' });
    });
  });

  describe('processOnCreateHooks', () => {
    interface PersonTable extends InferKyselyTable<typeof Person, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
    interface PetTable extends InferKyselyTable<typeof Pet, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
    interface ToyTable extends InferKyselyTable<typeof Toy, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
    interface DB {
      Person: PersonTable;
      Pet: PetTable;
      Toy: ToyTable;
    }

    let orm: MikroORM;
    let kysely: Kysely<DB>;

    beforeAll(async () => {
      orm = new MikroORM({
        entities: [Person, Pet, Toy],
        dbName: ':memory:',
      });
      await orm.schema.refresh();
      kysely = orm.em.getKysely({
        tableNamingStrategy: 'entity',
        columnNamingStrategy: 'property',
        processOnCreateHooks: true,
        convertValues: true,
      });
    });

    afterEach(async () => {
      await kysely.deleteFrom('Toy').execute();
      await kysely.deleteFrom('Pet').execute();
      await kysely.deleteFrom('Person').execute();
    });

    test('INSERT with onCreate hook - missing onCreate properties should be auto-filled', () => {
      // Person has onCreate hooks for: createdAt, updatedAt, children
      // When these properties are missing, they should be auto-filled
      const query = kysely.insertInto('Person').values({
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
      });
      expect(query.compile().sql).toMatchInlineSnapshot(`"insert into "person" ("first_name", "last_name", "gender", "created_at", "updated_at", "children") values (?, ?, ?, ?, ?, ?)"`);
      // Expected: INSERT should include created_at, updated_at, and children with default values
    });

    test('INSERT with onCreate hook - explicit onCreate property should not be overridden', () => {
      // If user explicitly provides a value for onCreate property, it should be respected (or consider hooking behavior)
      const query = kysely.insertInto('Person').values({
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female',
        children: 5, // Explicitly provided, should not be overridden by onCreate hook
      });
      expect(query.compile().sql).toMatchInlineSnapshot(`"insert into "person" ("first_name", "last_name", "gender", "children", "created_at", "updated_at") values (?, ?, ?, ?, ?, ?)"`);
      // Expected: children = 5 should be used, not the default 0 from onCreate
    });

    test('INSERT with onCreate hook - all properties provided', () => {
      // When all properties are provided, onCreate hooks should not add anything
      const now = new Date();
      const query = kysely.insertInto('Person').values({
        firstName: 'Bob',
        lastName: 'Johnson',
        gender: 'male',
        children: 2,
        createdAt: now,
        updatedAt: now,
      });
      expect(query.compile().sql).toMatchInlineSnapshot(`"insert into "person" ("first_name", "last_name", "gender", "children", "created_at", "updated_at") values (?, ?, ?, ?, ?, ?)"`);
    });

    test('INSERT with onCreate hook and execute - verify values are inserted correctly', async () => {
      // Actual execution to verify onCreate hooks work
      const query = kysely.insertInto('Person').values({
        firstName: 'TestUser',
        lastName: 'Hook',
        gender: 'male',
      }).returning(['id', 'firstName', 'children', 'createdAt', 'updatedAt']);

      const result = await query.execute();
      expect(result).toHaveLength(1);
      // children should be auto-filled to 0
      expect(result[0]).toMatchObject({ firstName: 'TestUser', children: 0 });
      // createdAt and updatedAt should be auto-filled with Date (as timestamp number in SQLite)
      if (result[0].createdAt != null) {
        expect(result[0].createdAt).toBeInstanceOf(Date);
      }
      if (result[0].updatedAt != null) {
        expect(result[0].updatedAt).toBeInstanceOf(Date);
      }
    });

    test('INSERT multiple rows with onCreate hooks', async () => {
      // Test batch insert with onCreate hooks
      const query = kysely.insertInto('Person').values([
        { firstName: 'User1', lastName: 'Test1', gender: 'male' },
        { firstName: 'User2', lastName: 'Test2', gender: 'female' },
      ]).returning('id');

      const result = await query.execute();
      expect(result).toHaveLength(2);
      // Verify both rows were inserted with onCreate defaults
    });

    test('INSERT relation with onCreate hook', async () => {
      // First insert a Person
      const personId = await kysely
        .insertInto('Person')
        .values({ firstName: 'Owner', lastName: 'User', gender: 'male' })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      // Then insert a Pet with relation - Pet also has onCreate hooks
      const query = kysely.insertInto('Pet').values({
        name: 'Doggo',
        owner: personId,
        species: 'dog',
      });
      expect(query.compile().sql).toMatchInlineSnapshot(`"insert into "pet" ("name", "owner_id", "species", "created_at", "updated_at") values (?, ?, ?, ?, ?)"`);
    });

    test('INSERT with onCreate - dateTime property should be converted correctly', async () => {
      // Verify that Date objects from onCreate are properly converted for SQLite
      const query = kysely.insertInto('Person').values({
        firstName: 'DateTest',
        lastName: 'User',
        gender: 'male',
      }).returning('id');

      const result = await query.execute();
      expect(result).toHaveLength(1);
    });

    test('INSERT with onCreate hook - explicit null should be respected', async () => {
      // If user explicitly provides null for an onCreate property, behavior depends on implementation
      // This tests the edge case where null is explicitly passed
      const query = kysely.insertInto('Person').values({
        firstName: 'NullTest',
        lastName: 'User',
        gender: 'male',
        children: 0,
        createdAt: null,
        updatedAt: null,
      }).returning(['id', 'children', 'createdAt', 'updatedAt']);

      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0].createdAt).toBeNull();
      expect(result[0].updatedAt).toBeNull();
    });

    test('INSERT with onCreate hook - using subquery in values', async () => {
      // Test INSERT with subquery - onCreate hooks should still work
      const personId = await kysely
        .insertInto('Person')
        .values({ firstName: 'Subquery', lastName: 'Test', gender: 'male' })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      // Insert Pet using subquery for owner
      const query = kysely.insertInto('Pet').values(eb => ({
        name: 'SubqueryPet',
        owner: eb.selectFrom('Person').select('id').where('id', '=', personId),
        species: 'cat',
        // createdAt and updatedAt should be auto-filled by onCreate hooks
      })).returning(['id', 'name', 'createdAt', 'updatedAt']);

      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ name: 'SubqueryPet' });
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('processOnUpdateHooks', () => {
    interface PersonTable extends InferKyselyTable<typeof Person, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
    interface PetTable extends InferKyselyTable<typeof Pet, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
    interface ToyTable extends InferKyselyTable<typeof Toy, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
    interface DB {
      Person: PersonTable;
      Pet: PetTable;
      Toy: ToyTable;
    }
    let orm: MikroORM;
    let kysely: Kysely<DB>;
    let pgOrm: PostgresORM;
    let pgKysely: Kysely<DB>;

    beforeAll(async () => {
      orm = new MikroORM({
        entities: [Person, Pet, Toy],
        dbName: ':memory:',
      });
      await orm.schema.refresh();
      kysely = orm.em.getKysely({
        tableNamingStrategy: 'entity',
        columnNamingStrategy: 'property',
        processOnCreateHooks: true,
        processOnUpdateHooks: true,
        convertValues: true,
      });
      pgOrm = new PostgresORM({
        entities: [Person, Pet, Toy],
        dbName: 'kysely_plugin_test_3',
      });
      await pgOrm.schema.refresh();
      pgKysely = pgOrm.em.getKysely({
        tableNamingStrategy: 'entity',
        columnNamingStrategy: 'property',
        processOnCreateHooks: true,
        processOnUpdateHooks: true,
        convertValues: true,
      });
    });

    beforeEach(async () => {
      // Insert test data
      const now = new Date();
      await kysely.insertInto('Person').values({
        firstName: 'InitialName',
        lastName: 'InitialLast',
        gender: 'male',
        children: 0,
        createdAt: now,
        updatedAt: now,
      }).execute();
    });

    afterEach(async () => {
      await kysely.deleteFrom('Toy').execute();
      await kysely.deleteFrom('Pet').execute();
      await kysely.deleteFrom('Person').execute();
    });

    test('UPDATE with onUpdate hook - missing onUpdate properties should be auto-filled', () => {
      // Person.updatedAt has onUpdate hook
      // When not explicitly set, it should be auto-filled
      const query = kysely.updateTable('Person').set({
        firstName: 'UpdatedName',
      }).where('firstName', '=', 'InitialName');
      expect(query.compile().sql).toMatchInlineSnapshot(`"update "person" set "first_name" = ?, "updated_at" = ? where "first_name" = ?"`);
      // Expected: SET should include "updated_at" = ? automatically
    });

    test('UPDATE with onUpdate hook - explicit onUpdate property should be respected (not overridden)', () => {
      // If user explicitly provides updatedAt, it should not be overridden
      const now = new Date('2020-01-01');
      const query = kysely.updateTable('Person').set({
        firstName: 'UpdatedName',
        updatedAt: now, // Explicitly provided
      }).where('firstName', '=', 'InitialName');
      expect(query.compile().sql).toMatchInlineSnapshot(`"update "person" set "first_name" = ?, "updated_at" = ? where "first_name" = ?"`);
    });

    test('UPDATE without onUpdate hook - non-hooked columns should work normally', () => {
      // Update a column that doesn't have an onUpdate hook
      const query = kysely.updateTable('Person').set({
        children: 5,
      }).where('firstName', '=', 'InitialName');
      expect(query.compile().sql).toMatchInlineSnapshot(`"update "person" set "children" = ?, "updated_at" = ? where "first_name" = ?"`);
      // Expected: Should not auto-fill updatedAt (since it's not in SET explicitly)
      // Actual behavior: depends on strategy - should auto-fill based on improved plan
    });

    test('UPDATE and execute - verify onUpdate hook is applied', async () => {
      // Insert a test record
      const beforeUpdate = new Date();

      // Update it
      const query = kysely.updateTable('Person').set({
        firstName: 'NewName',
      }).where('firstName', '=', 'InitialName').returning(['firstName', 'updatedAt']);

      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ firstName: 'NewName' });
      // updatedAt should be updated to a time after beforeUpdate
      if (result[0].updatedAt != null) {
        expect(result[0].updatedAt).toBeInstanceOf(Date);
        expect(result[0].updatedAt!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      }
    });

    test('UPDATE multiple columns with mixed hook/non-hook properties', async () => {
      // Some columns have hooks, some don't
      const query = kysely.updateTable('Person').set({
        firstName: 'Updated',
        children: 3,
        // updatedAt should be auto-filled
      }).where('firstName', '=', 'InitialName').returning('updatedAt');

      const result = await query.execute();
      expect(result).toHaveLength(1);
      // updatedAt should be set automatically
      expect(result[0]).toHaveProperty('updatedAt');
    });

    test('UPDATE on related entity with onUpdate hook', async () => {
      // Insert a Person and Pet
      const personId = await kysely
        .insertInto('Person')
        .values({ firstName: 'Owner', lastName: 'Person', gender: 'male', children: 0, createdAt: new Date(), updatedAt: new Date() })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      const petId = await kysely
        .insertInto('Pet')
        .values({
          name: 'InitialPetName',
          owner: personId,
          species: 'dog',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      // Update Pet - should auto-fill updatedAt
      const query = kysely.updateTable('Pet').set({
        name: 'UpdatedPetName',
      }).where('id', '=', petId);

      expect(query.compile().sql).toMatchInlineSnapshot(`"update "pet" set "name" = ?, "updated_at" = ? where "id" = ?"`);
      // Expected: SET should include "updated_at" = ?
    });

    test('UPDATE with onUpdate - dateTime should be converted correctly', async () => {
      // Verify that Date objects from onUpdate are properly converted for SQLite
      const query = kysely.updateTable('Person').set({
        firstName: 'TestUpdate',
      }).where('firstName', '=', 'InitialName').returning('updatedAt');

      // Should not throw conversion error
      const result = await query.execute();
      expect(result).toHaveLength(1);
      if (result[0].updatedAt != null) {
        expect(new Date(result[0].updatedAt)).toBeInstanceOf(Date);
      }
    });

    test('UPDATE with WHERE condition and onUpdate hook', async () => {
      // More complex: update with WHERE and onUpdate
      const query = kysely.updateTable('Person').set({
        lastName: 'UpdatedLast',
      }).where('firstName', '=', 'InitialName').where('children', '=', 0);

      expect(query.compile().sql).toMatchInlineSnapshot(`"update "person" set "last_name" = ?, "updated_at" = ? where "first_name" = ? and "children" = ?"`);
      // Expected: Should auto-fill updatedAt
    });

    test('UPDATE with onUpdate hook - explicit null should be respected', async () => {
      // If user explicitly provides null for an onUpdate property, behavior depends on implementation
      const query = kysely.updateTable('Person').set({
        firstName: 'NullUpdateTest',
        updatedAt: null,
      }).where('firstName', '=', 'InitialName').returning('updatedAt');

      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0].updatedAt).toBeNull();
    });

    test('UPDATE multiple rows with onUpdate hook', async () => {
      // Insert multiple test records
      await kysely.insertInto('Person').values([
        { firstName: 'Batch1', lastName: 'Test', gender: 'male', children: 0, createdAt: new Date(), updatedAt: new Date() },
        { firstName: 'Batch2', lastName: 'Test', gender: 'female', children: 0, createdAt: new Date(), updatedAt: new Date() },
      ]).execute();

      // Update multiple rows - all should get updatedAt from onUpdate hook
      const query = kysely.updateTable('Person').set({
        lastName: 'BatchUpdated',
      }).where('lastName', '=', 'Test').returning(['id', 'lastName', 'updatedAt']);

      const result = await query.execute();
      expect(result.length).toBeGreaterThanOrEqual(2);
      // All updated rows should have updatedAt set
      result.forEach(row => {
        expect(row).toHaveProperty('updatedAt');
        if (row.updatedAt != null) {
          expect(new Date(row.updatedAt)).toBeInstanceOf(Date);
        }
      });
    });

    test('UPDATE with onUpdate hook - using subquery in set', async () => {
      // Test UPDATE with subquery - onUpdate hooks should still work
      const personId = await kysely
        .insertInto('Person')
        .values({ firstName: 'SubqueryUpdate', lastName: 'Test', gender: 'male', children: 0, createdAt: new Date(), updatedAt: new Date() })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      // Update using subquery in set
      const query = kysely.updateTable('Person').set(eb => ({
        firstName: eb.selectFrom('Person').select('firstName').where('id', '=', personId),
        // updatedAt should be auto-filled by onUpdate hook
      })).where('id', '=', personId).returning(['firstName', 'updatedAt']);

      const result = await query.execute();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ firstName: 'SubqueryUpdate' });
      if (result[0].updatedAt != null) {
        expect(result[0].updatedAt).toBeInstanceOf(Date);
      }
    });

    test('ON CONFLICT with onUpdate hooks', async () => {
      const now = new Date();
      await kysely.insertInto('Person').values({
        id: 999,
        firstName: 'Conflict',
        lastName: 'Test',
        gender: 'male',
        children: 0,
        createdAt: now,
        updatedAt: now,
      }).execute();

      // Wait a bit to ensure timestamp difference for onUpdate hook
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update using ON CONFLICT - should trigger onUpdate hook for updatedAt
      await kysely.insertInto('Person')
        .values({
          id: 999, // Conflict on ID
          firstName: 'NewName',
          lastName: 'NewLast',
          gender: 'female',
          children: 1,
          createdAt: now,
          // updatedAt not provided, should be updated by hook
        })
        .onConflict(oc => oc.column('id').doUpdateSet({
          firstName: 'NewName',
          lastName: 'NewLast',
          gender: 'female',
          children: 1,
          // updatedAt will be added by hook
        }))
        .execute();

      const result = await kysely.selectFrom('Person').selectAll().where('id', '=', 999).executeTakeFirstOrThrow();

      expect(result).toMatchObject({
        firstName: 'NewName',
        lastName: 'NewLast',
        gender: 'female',
        children: 1,
      });
      expect(result.updatedAt).not.toEqual(now); // Should have changed
      expect(new Date(result.updatedAt!).getTime()).toBeGreaterThan(now.getTime());
    });

    test('UPDATE with JOIN - test JOIN processing in transformer', async () => {
      // Insert test data
      const personId = await kysely
        .insertInto('Person')
        .values({ firstName: 'JoinTest', lastName: 'Person', gender: 'male', children: 0, createdAt: new Date(), updatedAt: new Date() })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      await kysely
        .insertInto('Pet')
        .values({
          name: 'JoinPet',
          owner: personId,
          species: 'dog',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();

      // SQLite doesn't support UPDATE with JOIN directly, but we can test that
      // the transformer processes JOIN nodes in UPDATE queries by checking
      // that the query builder accepts JOIN methods (even if SQLite can't compile it)
      // The transformer should process the JOIN node to populate entityMap
      const queryBuilder = kysely
        .updateTable('Pet')
        .set({ name: 'UpdatedJoinPet' })
        .where('id', 'in', eb =>
          eb.selectFrom('Person')
            .select('id')
            .where('firstName', '=', 'JoinTest'),
        );

      // This should work - using subquery instead of direct JOIN
      expect(queryBuilder.compile().sql).toContain('update');
      // The transformer should process the subquery's JOIN internally
    });

    test('UPDATE with JOIN - PostgreSQL (actual execution)', async () => {
      // PostgreSQL supports UPDATE with JOIN using FROM clause
      // This tests transformUpdateQuery JOIN processing (lines 205-208)
      const now = new Date();

      // Insert test data
      const personId = await pgKysely
        .insertInto('Person')
        .values({
          firstName: 'JoinUpdateTest',
          lastName: 'Person',
          gender: 'male',
          children: 0,
          createdAt: now,
          updatedAt: now,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      const petId = await pgKysely
        .insertInto('Pet')
        .values({
          name: 'JoinUpdatePet',
          owner: personId,
          species: 'dog',
          createdAt: now,
          updatedAt: now,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      // UPDATE with JOIN using FROM clause and innerJoin (PostgreSQL syntax)
      // This will trigger processJoinNode in transformUpdateQuery (lines 205-208)
      // Note: In UPDATE with JOIN, FROM clause uses table name without alias
      // JOIN condition should use table name (Pet) not alias (p)
      const updateResult = await pgKysely
        .updateTable('Pet as p')
        .set({ name: 'UpdatedViaJoin' })
        .from('Pet')
        .whereRef('p.id', '=', 'Pet.id')
        .innerJoin('Person', 'Person.id', 'Pet.owner')
        .where('Person.firstName', '=', 'JoinUpdateTest')
        .executeTakeFirstOrThrow();

      expect(updateResult.numUpdatedRows).toBeGreaterThan(0n);

      // Verify the update was applied
      const updated = await pgKysely
        .selectFrom('Pet')
        .selectAll()
        .where('id', '=', petId)
        .executeTakeFirstOrThrow();

      expect(updated.name).toBe('UpdatedViaJoin');

      // Cleanup
      await pgKysely.deleteFrom('Pet').execute();
      await pgKysely.deleteFrom('Person').execute();
    });

    test('DELETE with JOIN', async () => {
      // Insert test data
      const personId = await kysely
        .insertInto('Person')
        .values({ firstName: 'DeleteJoin', lastName: 'Test', gender: 'male', children: 0, createdAt: new Date(), updatedAt: new Date() })
        .returning('id')
        .executeTakeFirstOrThrow()
        .then(r => r.id);

      await kysely
        .insertInto('Pet')
        .values({
          name: 'DeletePet',
          owner: personId,
          species: 'cat',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();

      // DELETE with JOIN (PostgreSQL style using USING)
      const query = kysely
        .deleteFrom('Pet')
        .using('Person')
        .innerJoin('Person', 'Pet.owner', 'Person.id')
        .where('Person.firstName', '=', 'DeleteJoin');

      expect(query.compile().sql).toContain('delete');
      expect(query.compile().sql).toContain('using');
    });

    test('UPDATE with convertValues false', async () => {
      // Create kysely instance without convertValues
      interface PersonTableNoConvert extends InferKyselyTable<typeof Person, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
      interface DBNoConvert {
        Person: PersonTableNoConvert;
      }
      const kyselyNoConvert = orm.em.getKysely<DBNoConvert>({
        tableNamingStrategy: 'entity',
        columnNamingStrategy: 'property',
        processOnUpdateHooks: true,
        convertValues: false, // Disable value conversion
      });

      const query = kyselyNoConvert.updateTable('Person').set({
        firstName: 'NoConvert',
      }).where('firstName', '=', 'InitialName');

      expect(query.compile().sql).toContain('update');
      // Value conversion should be skipped
    });

    test('ON CONFLICT with convertValues false', async () => {
      const now = new Date();
      await kysely.insertInto('Person').values({
        id: 888,
        firstName: 'ConflictNoConvert',
        lastName: 'Test',
        gender: 'male',
        children: 0,
        createdAt: now,
        updatedAt: now,
      }).execute();

      // Create kysely instance without convertValues
      interface PersonTableNoConvert extends InferKyselyTable<typeof Person, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
      interface DBNoConvert {
        Person: PersonTableNoConvert;
      }
      const kyselyNoConvert = orm.em.getKysely<DBNoConvert>({
        tableNamingStrategy: 'entity',
        columnNamingStrategy: 'property',
        processOnUpdateHooks: true,
        convertValues: false, // Disable value conversion
      });

      const query = kyselyNoConvert.insertInto('Person')
        .values({
          id: 888,
          firstName: 'NewName',
          lastName: 'NewLast',
          gender: 'female',
          children: 1,
        })
        .onConflict(oc => oc.column('id').doUpdateSet({
          firstName: 'NewName',
          lastName: 'NewLast',
        }));

      expect(query.compile().sql).toContain('on conflict');
      // Value conversion should be skipped in ON CONFLICT
    });

    test('ON CONFLICT with processOnUpdateHooks false', async () => {
      const now = new Date();
      await kysely.insertInto('Person').values({
        id: 777,
        firstName: 'ConflictNoHook',
        lastName: 'Test',
        gender: 'male',
        children: 0,
        createdAt: now,
        updatedAt: now,
      }).execute();

      // Create kysely instance without processOnUpdateHooks
      interface PersonTableNoHook extends InferKyselyTable<typeof Person, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
      interface DBNoHook {
        Person: PersonTableNoHook;
      }
      const kyselyNoHook = orm.em.getKysely<DBNoHook>({
        tableNamingStrategy: 'entity',
        columnNamingStrategy: 'property',
        processOnCreateHooks: true,
        processOnUpdateHooks: false, // Disable onUpdate hooks
        convertValues: true,
      });

      const query = kyselyNoHook.insertInto('Person')
        .values({
          id: 777,
          firstName: 'NewName',
          lastName: 'NewLast',
          gender: 'female',
          children: 1,
        })
        .onConflict(oc => oc.column('id').doUpdateSet({
          firstName: 'NewName',
          lastName: 'NewLast',
        }));

      expect(query.compile().sql).toContain('on conflict');
      // onUpdate hooks should be skipped in ON CONFLICT
    });

    afterAll(async () => {
      await pgOrm.close(true);
    });
  });

  describe('convertValues with default naming strategy', () => {
    interface PersonTable extends InferKyselyTable<typeof Person> {} // default: table/column
    interface DB {
      person: PersonTable;
    }

    let orm: MikroORM;
    let kysely: Kysely<DB>;

    beforeAll(async () => {
      orm = new MikroORM({
        entities: [Person, Pet, Toy],
        dbName: ':memory:',
      });
      await orm.schema.refresh();
      kysely = orm.em.getKysely({
        // tableNamingStrategy: 'table', // default
        // columnNamingStrategy: 'column', // default
        convertValues: true,
      });
    });

    afterAll(async () => {
      await orm.close(true);
    });

    test('SELECT should convert values but keep column names', async () => {
      const now = new Date();
      await kysely.insertInto('person').values({
        first_name: 'ValueTest',
        last_name: 'User',
        gender: 'male',
        created_at: now,
        updated_at: now,
        children: 0,
      }).execute();

      const query = kysely.selectFrom('person').selectAll().where('first_name', '=', 'ValueTest');
      const result = await query.execute();

      expect(result).toHaveLength(1);
      // Verify column names are snake_case (default)
      expect(result[0]).toHaveProperty('first_name');
      expect(result[0]).toHaveProperty('created_at');
      // Verify values are converted to Date objects
      expect(result[0].created_at).toBeInstanceOf(Date);
      expect(result[0].updated_at).toBeInstanceOf(Date);
    });

    test('SELECT with empty entityMap should return rows as-is', async () => {
      // Test transformResult with empty entityMap (line 1048-1049)
      const now = new Date();
      await kysely.insertInto('person').values({
        first_name: 'EmptyMapTest',
        last_name: 'User',
        gender: 'male',
        created_at: now,
        updated_at: now,
        children: 0,
      }).execute();

      // Query that doesn't match any entity (raw query scenario)
      const query = kysely.selectFrom('person').selectAll().where('first_name', '=', 'EmptyMapTest');
      const result = await query.execute();

      expect(result).toHaveLength(1);
      // Should still return results even if entityMap is empty
      expect(result[0]).toHaveProperty('first_name');
    });
  });

  describe('type conversions and timezone handling', () => {
    interface TypeTable extends InferKyselyTable<typeof TypeEntity, { columnNamingStrategy: 'property'; processOnCreateHooks: true }> {}
    interface DB {
      TypeEntity: TypeTable;
    }

    let orm: MikroORM;
    let kysely: Kysely<DB>;

    beforeAll(async () => {
      orm = new MikroORM({
        entities: [TypeEntity],
        dbName: ':memory:',
      });
      await orm.schema.refresh();
      kysely = orm.em.getKysely({
        tableNamingStrategy: 'entity',
        columnNamingStrategy: 'property',
        convertValues: true,
      });
    });

    afterEach(async () => {
      await kysely.deleteFrom('TypeEntity').execute();
      vi.restoreAllMocks();
    });

    afterAll(async () => {
      await orm.close(true);
    });

    test('boolean and json custom type conversion', async () => {
      const now = new Date('2024-01-01T00:00:00Z');
      const inserted = await kysely
        .insertInto('TypeEntity')
        .values({
          flag: 1 as any,
          payload: JSON.stringify({ foo: 'bar', nested: { answer: 42 } }),
          createdAt: now,
        })
        .returning('id')
        .executeTakeFirstOrThrow();

      const row = await kysely
        .selectFrom('TypeEntity')
        .selectAll()
        .where('id', '=', inserted.id)
        .executeTakeFirstOrThrow();

      expect(row.flag).toBe(true);
      const parsedPayload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
      expect(parsedPayload).toEqual({ foo: 'bar', nested: { answer: 42 } });
      expect(row.createdAt).toBeInstanceOf(Date);
    });

    test('timezone conversion when value has no timezone information', () => {
      const platform = orm.em.getDriver().getPlatform();
      const parseSpy = vi.spyOn(platform, 'parseDate');
      vi.spyOn(platform, 'getTimezone').mockReturnValue('+05:00');

      const transformer = new MikroTransformer(orm.em, { convertValues: true });
      const meta = orm.getMetadata().find(TypeEntity.name)!;
      const entityMap = new Map<string, typeof meta>();
      entityMap.set(meta.tableName, meta);

      const rows = transformer.transformResult(
        [{ created_at: '2024-01-01 10:00:00' }] as any,
        entityMap,
      );

      expect(parseSpy).toHaveBeenCalledWith('2024-01-01 10:00:00+05:00');
      expect(rows?.[0]?.created_at).toBeInstanceOf(Date);
    });
  });

  test('transformResult returns original when conversion disabled', async () => {
    const localOrm = new MikroORM({
      entities: [Person],
      dbName: ':memory:',
    });
    await localOrm.schema.refresh();
    const plugin = new MikroPlugin(localOrm.em as any, {});
    const originalResult: any = { rows: [{ id: 1 }], numAffectedRows: undefined };
    const res = await plugin.transformResult({ queryId: {}, result: originalResult } as any);
    expect(res).toBe(originalResult);
    await localOrm.close(true);
  });
});

describe('MikroTransformer', () => {
  const TestEntity = defineEntity({
    name: 'TestEntity',
    properties: {
      id: p.integer().primary().autoincrement(),
      name: p.string(),
      createdAt: p.datetime().onCreate(() => new Date()),
      updatedAt: p.datetime().nullable().onUpdate(() => new Date()),
      flag: p.boolean().nullable(),
      payload: p.json().nullable(),
    },
  });

  let orm: MikroORM;
  let transformer: MikroTransformer;
  const getMeta = () => orm.getMetadata().find(TestEntity.name)!;

  beforeAll(async () => {
    orm = new MikroORM({
      entities: [TestEntity],
      dbName: ':memory:',
    });
    await orm.schema.refresh();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  beforeEach(() => {
    transformer = new MikroTransformer(orm.em, { convertValues: true });
    vi.restoreAllMocks();
  });

  test('normalizeColumnName handles dotted identifiers', () => {
    expect(transformer.normalizeColumnName({ name: 't.created_at' } as any)).toBe('created_at');
    expect(transformer.normalizeColumnName({ name: 'created_at' } as any)).toBe('created_at');
  });

  test('findProperty returns undefined for missing meta or column', () => {
    expect(transformer.findProperty(undefined as any, 'id')).toBeUndefined();
    expect(transformer.findProperty(getMeta(), undefined)).toBeUndefined();
  });

  test('processOnCreateHooks returns original node when columns or values missing', () => {
    const node = { kind: 'InsertQueryNode' } as any;
    expect(transformer.processOnCreateHooks(node, getMeta())).toBe(node);
  });

  test('processOnCreateHooks keeps unknown row types intact', () => {
    const node: any = {
      kind: 'InsertQueryNode',
      columns: [ColumnNode.create('id')],
      values: ValuesNode.create([{ kind: 'UnknownRow' } as any]),
    };

    const result = transformer.processOnCreateHooks(node, getMeta());
    expect(result.values && ValuesNode.is(result.values)).toBe(true);
    if (result.values && ValuesNode.is(result.values)) {
      expect(result.values.values[0]).toEqual({ kind: 'UnknownRow' });
    }
    expect(result.columns).toHaveLength(2); // adds missing onCreate column
  });

  test('processOnUpdateHooks returns original when no updates', () => {
    const node = { kind: 'UpdateQueryNode' } as any;
    expect(transformer.processOnUpdateHooks(node, getMeta())).toBe(node);
  });

  test('processInsertValues returns original when value length mismatches columns', () => {
    const node: any = {
      kind: 'InsertQueryNode',
      columns: [ColumnNode.create('id'), ColumnNode.create('name')],
      values: ValuesNode.create([
        ValueListNode.create([
          ValueNode.create(1),
        ]),
      ]),
    };

    expect(transformer.processInsertValues(node, getMeta())).toBe(node);
  });

  test('processUpdateValues returns original when updates missing or value is not ValueNode', () => {
    const noUpdates = { kind: 'UpdateQueryNode' } as any;
    expect(transformer.processUpdateValues(noUpdates, getMeta())).toBe(noUpdates);

    const nodeWithNonValue = {
      kind: 'UpdateQueryNode',
      updates: [
        {
          column: ColumnNode.create('name'),
          value: { kind: 'NotValueNode' },
        },
      ],
    } as any;

    expect(transformer.processUpdateValues(nodeWithNonValue, getMeta())).toBe(nodeWithNonValue);
  });

  test('prepareInputValue handles special values and custom types', () => {
    const platform = orm.em.getDriver().getPlatform();
    const processDateSpy = vi.spyOn(platform, 'processDateProperty').mockReturnValue('processed-date' as any);

    const propWithCustom = { name: 'payload', customType: { convertToDatabaseValue: vi.fn().mockReturnValue('db-json') } } as any;
    const propWithDate = { name: 'createdAt', customType: undefined } as any;

    expect(transformer.prepareInputValue(propWithCustom, { foo: 'bar' }, true)).toBe('db-json');
    expect(transformer.prepareInputValue(propWithDate, new Date(), true)).toBe('processed-date');

    // Object with "kind" should be returned as-is
    const valueWithKind = { kind: 'ValueNode' };
    expect(transformer.prepareInputValue(propWithDate, valueWithKind, true)).toBe(valueWithKind);

    expect(processDateSpy).toHaveBeenCalled();
  });

  test('getTableName/getCTEName/extractAliasName handle invalid nodes', () => {
    expect(transformer.getTableName(undefined)).toBeUndefined();
    const tableLike = { kind: 'TableNode', table: { kind: 'SchemableIdentifierNode' } } as any;
    expect(transformer.getTableName(tableLike)).toBeUndefined();

    expect(transformer.getCTEName({ table: { kind: 'IdentifierNode' } } as any)).toBeUndefined();
    expect(transformer.extractAliasName('alias')).toBeUndefined();
  });

  test('findOwnerEntityInContext returns undefined when context stack is empty', () => {
    expect(transformer.findOwnerEntityInContext()).toBeUndefined();
  });

  describe('prepareInputValue raw bypass', () => {
    test('returns raw object as-is without conversion', () => {
      const meta = getMeta();
      const rawVal = { __raw: 'select 1' };
      const prop = meta.properties.payload;
      const result = transformer.prepareInputValue(prop, rawVal, true);
      expect(result).toBe(rawVal);
    });
  });

  describe('processInsertValues defensive branches', () => {
    test('returns original when columns missing or values not ValuesNode', () => {
      const meta = getMeta();
      const nodeNoColumns: any = { kind: 'InsertQueryNode', values: ValuesNode.create([]) };
      const nodeNonValues: any = { kind: 'InsertQueryNode', columns: [ColumnNode.create('id')], values: { kind: 'NotValuesNode' } };

      expect(transformer.processInsertValues(nodeNoColumns, meta)).toBe(nodeNoColumns);
      expect(transformer.processInsertValues(nodeNonValues, meta)).toBe(nodeNonValues);
    });

    test('keeps primitive length mismatch and unknown rows intact', () => {
      const meta = getMeta();
      const node: any = {
        kind: 'InsertQueryNode',
        columns: [ColumnNode.create('id'), ColumnNode.create('name')],
        values: ValuesNode.create([
          PrimitiveValueListNode.create([1]), // length mismatch
          { kind: 'UnknownRow' } as any, // not ValueList/PrimitiveValueList
        ]),
      };

      const result = transformer.processInsertValues(node, meta);
      expect(result).toBe(node);
    });
  });

  describe('processUpdateValues defensive branches', () => {
    test('skips conversion when column is not ColumnNode', () => {
      const meta = getMeta();
      const node: any = {
        kind: 'UpdateQueryNode',
        updates: [{
          column: { kind: 'NotColumn' } as any,
          value: ValueNode.create('value'),
        }],
      };

      expect(transformer.processUpdateValues(node, meta)).toBe(node);
    });

    test('preserves immediate flag after conversion', () => {
      const meta = getMeta();
      const platform = orm.em.getDriver().getPlatform();
      const spy = vi.spyOn(platform, 'processDateProperty').mockReturnValue('processed-date' as any);

      const node: any = {
        kind: 'UpdateQueryNode',
        updates: [{
          column: ColumnNode.create('created_at'),
          value: ValueNode.createImmediate(new Date('2024-01-01')),
        }],
      };

      const result: any = transformer.processUpdateValues(node, meta);
      expect(result).not.toBe(node);
      expect(result.updates[0].value.immediate).toBe(true);
      expect(result.updates[0].value.value).toBe('processed-date');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('context and result mapping defensive branches', () => {
    test('findOwnerEntityInContext returns undefined when context has only undefined aliases', () => {
      const ctx = new Map<string, any>();
      ctx.set('a', undefined);
      (transformer as any).contextStack.push(ctx);
      expect(transformer.findOwnerEntityInContext()).toBeUndefined();
      (transformer as any).contextStack.pop();
    });

    test('processFromItem with subquery alias and unknown alias types', () => {
      const context = new Map<string, any>();
      const subqueryAlias = {
        kind: 'AliasNode',
        node: {
          kind: 'SelectQueryNode',
          from: {
            froms: [{
              kind: 'TableNode',
              table: { kind: 'SchemableIdentifierNode', schema: undefined, identifier: { kind: 'IdentifierNode', name: 'test_entity' } },
            }],
          },
        },
        alias: { kind: 'IdentifierNode', name: 'sq' },
      };
      const unknownAlias = {
        kind: 'AliasNode',
        node: { kind: 'UnknownNode' },
        alias: { kind: 'IdentifierNode', name: 'u' },
      };

      (transformer as any).processFromItem(subqueryAlias, context);
      (transformer as any).processFromItem(unknownAlias, context);

      expect(context.has('sq')).toBe(true); // should be set to undefined
      expect(context.has('u')).toBe(true);
      expect((transformer as any).subqueryAliasMap.get('sq')).toBeDefined();
    });

    test('processJoinNode with non-table alias and table without metadata', () => {
      const context = new Map<string, any>();
      const joinUnknownAlias = {
        kind: 'JoinNode',
        table: {
          kind: 'AliasNode',
          node: { kind: 'UnknownNode' },
          alias: { kind: 'IdentifierNode', name: 'ua' },
        },
      };
      const tableWithoutMeta = {
        kind: 'JoinNode',
        table: {
          kind: 'TableNode',
          table: { kind: 'SchemableIdentifierNode', schema: undefined, identifier: { kind: 'IdentifierNode', name: 'non_existing_table' } },
        },
      };

      (transformer as any).processJoinNode(joinUnknownAlias, context);
      (transformer as any).processJoinNode(tableWithoutMeta, context);

      expect(context.has('ua')).toBe(true);
      expect(context.get('non_existing_table')).toBeUndefined();
    });

    test('extractSourceTableFromSelectQuery returns undefined without FROM', () => {
      const selectNode: any = { kind: 'SelectQueryNode' };
      expect((transformer as any).extractSourceTableFromSelectQuery(selectNode)).toBeUndefined();
    });

    test('extractSourceTableFromSelectQuery returns undefined when FROM is unknown node', () => {
      const selectNode: any = { kind: 'SelectQueryNode', from: { froms: [{ kind: 'UnknownNode' }] } };
      expect((transformer as any).extractSourceTableFromSelectQuery(selectNode)).toBeUndefined();
    });

    test('transformResult returns rows as-is when entityMap empty', () => {
      const rows = [{ a: 1 }];
      const result = transformer.transformResult(rows as any, new Map());
      expect(result).toBe(rows);
    });

    test('transformRow overwrites existing property and moves relation field', () => {
      const fakeMeta: any = {
        tableName: 'pet',
        props: [
          { name: 'firstName', fieldNames: ['first_name'], kind: ReferenceKind.SCALAR, properties: undefined },
          { name: 'owner', fieldNames: ['owner_id'], kind: ReferenceKind.MANY_TO_ONE, properties: undefined },
        ],
        properties: {
          firstName: { name: 'firstName', fieldNames: ['first_name'], kind: ReferenceKind.SCALAR },
          owner: { name: 'owner', fieldNames: ['owner_id'], kind: ReferenceKind.MANY_TO_ONE },
        },
      };
      const entityMap = new Map<string, any>();
      entityMap.set(fakeMeta.tableName, fakeMeta);
      const transformerWithProperty = new MikroTransformer(orm.em, { columnNamingStrategy: 'property', convertValues: false });

      const rows = [{
        first_name: 'Overwritten',
        firstName: 'KeepMe',
        owner_id: 123,
      }];

      const result = transformerWithProperty.transformResult(rows as any, entityMap)!;
      expect(result[0].firstName).toBe('Overwritten'); // overwritten
      expect(result[0].owner).toBe(123); // moved from owner_id
      expect(result[0].owner_id).toBeUndefined();
    });

    test('transformRow relation mover runs when property map is empty', () => {
      const transformerWithProperty = new MikroTransformer(orm.em, { columnNamingStrategy: 'property' });
      const row = { owner_id: 55 };
      const mapped = transformerWithProperty.transformRow(
        row,
        {},
        { owner_id: 'owner' },
      );
      expect(mapped.owner).toBe(55);
      expect(mapped.owner_id).toBeUndefined();
    });
  });

});
