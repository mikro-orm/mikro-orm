import { defineEntity, p } from '@mikro-orm/core';
import { InferKyselyDB, Kysely, MikroORM } from '@mikro-orm/sqlite';

describe('custom kysely plugin', () => {
  const Person = defineEntity({
    name: 'Person',
    properties: {
      id: p.integer().autoincrement().primary(),
      createdAt: p.datetime().onCreate(() => new Date()),
      updatedAt: p.datetime().onCreate(() => new Date()).onUpdate(() => new Date()),
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
    type DB = InferKyselyDB<typeof Person | typeof Pet | typeof Toy, { columnNamingStrategy: 'property' }>;
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

  test.todo('processOnCreateHooks', async () => {
    const orm = new MikroORM({
      entities: [Person, Pet, Toy],
      dbName: ':memory:',
    });
    await orm.getSchemaGenerator().createSchema();
    const kysely = orm.em.getKysely({
      tableNamingStrategy: 'entity',
      columnNamingStrategy: 'property',
      processOnCreateHooks: true,
    });

    expect(
      kysely.insertInto('Person').values({
        id: 1,
        gender:'female',
        firstName: 'John',
        lastName: 'Doe',
      }).compile().sql,
    ).toMatchInlineSnapshot(`"insert into "person" ("id", "gender", "first_name", "last_name", "created_at", "updated_at", "children") values (?, ?, ?, ?, ?, ?, 0)"`);

    expect(kysely.updateTable('Person').set({
      children: 3,
    }).where('id', '=', 1).compile().sql,
    ).toMatchInlineSnapshot(`"update "person" set "children" = ? where "id" = ?"`);
  });

  test.todo('processOnUpdateHooks', async () => {
    const orm = new MikroORM({
      entities: [Person, Pet, Toy],
      dbName: ':memory:',
    });
    await orm.getSchemaGenerator().createSchema();
    const kysely = orm.em.getKysely({
      tableNamingStrategy: 'entity',
      columnNamingStrategy: 'property',
      processOnCreateHooks: true,
      processOnUpdateHooks: true,
    });


    expect(kysely.updateTable('Person').set({
      children: 3,
    }).where('id', '=', 1).compile().sql,
    ).toMatchInlineSnapshot(`"update "person" set "children" = ? and "updated_at" = ? where "id" = ?"`);
  });
});
