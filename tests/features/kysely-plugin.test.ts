import { defineEntity, p } from '@mikro-orm/core';
import { InferKyselyDB, InferKyselyTable, Kysely, MikroORM } from '@mikro-orm/sqlite';

describe('custom kysely plugin', () => {
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

  describe('tableNamingStrategy: entity', () => {
    type DB = InferKyselyDB<typeof Person | typeof Pet | typeof Toy, { tableNamingStrategy: 'entity' }>;
    let orm: MikroORM;
    let kysely: Kysely<DB>;

    beforeAll(async () => {
      orm = new MikroORM({
        entities: [Person, Pet, Toy],
        dbName: ':memory:',
      });
      await orm.getSchemaGenerator().createSchema();
      kysely = orm.em.getKysely({
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
  });

  describe('columnNamingStrategy: property', () => {
    interface PersonTable extends InferKyselyTable<typeof Person, 'property', true> {}
    interface PetTable extends InferKyselyTable<typeof Pet, 'property', true> {}
    interface ToyTable extends InferKyselyTable<typeof Toy, 'property', true> {}
    interface DB {
      person: PersonTable;
      pet: PetTable;
      toy: ToyTable;
    }
    let orm: MikroORM;
    let kysely: Kysely<DB>;

    beforeAll(async () => {
      orm = new MikroORM({
        entities: [Person, Pet, Toy],
        dbName: ':memory:',
      });
      await orm.getSchemaGenerator().createSchema();
      kysely = orm.em.getKysely({
        columnNamingStrategy: 'property',
        convertValues: true,
      });
    });

    beforeEach(async () => {
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
    interface PersonTable extends InferKyselyTable<typeof Person, 'property', true> {}
    interface PetTable extends InferKyselyTable<typeof Pet, 'property', true> {}
    interface ToyTable extends InferKyselyTable<typeof Toy, 'property', true> {}
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
      await orm.getSchemaGenerator().createSchema();
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
    interface PersonTable extends InferKyselyTable<typeof Person, 'property', true> {}
    interface PetTable extends InferKyselyTable<typeof Pet, 'property', true> {}
    interface ToyTable extends InferKyselyTable<typeof Toy, 'property', true> {}
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
      await orm.getSchemaGenerator().createSchema();
      kysely = orm.em.getKysely({
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
      await orm.getSchemaGenerator().createSchema();
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
  });
});
