import { Entity, LoadStrategy, ManyToOne, MikroORM, PrimaryKey, wrap } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

}

@Entity()
export class B {

  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => A, onDelete: 'cascade' })
  a!: A;

}

describe('GH issue 2675', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B],
      dbName: 'mikro_orm_test_gh_2675',
      driver: PostgreSqlDriver,
    });
    await orm.schema.ensureDatabase();

    // Create schema dynamically
    await orm.schema.execute(`drop schema if exists myschema cascade`);
    await orm.schema.execute(`create schema if not exists myschema`);

    // Initialize DB for dynamic schema entity
    await orm.schema.execute(`create table "myschema"."a" ("id" serial primary key);`);
    await orm.schema.execute(`create table "myschema"."b" ("id" serial primary key, "a_id" int not null);`);
    await orm.schema.execute(`alter table "myschema"."b" add constraint "b_a_id_foreign" foreign key ("a_id") references "myschema"."a" ("id") on update cascade on delete cascade;`);
  });

  afterAll(() => orm.close(true));

  test('should query with specified schema without throwing sql exception', async () => {
    // Create sample data
    const a = orm.em.create(A, {}, {
      schema: 'myschema',
    });
    expect(wrap(a).getSchema()).toBe('myschema');
    orm.em.persist(a);

    const b = orm.em.create(B, { a }, {
      schema: 'myschema',
    });
    expect(wrap(b).getSchema()).toBe('myschema');
    orm.em.persist(b);

    await orm.em.flush();

    const r = await orm.em.fork().findOne(B, b.id, {
      populate: ['a'],
      strategy: LoadStrategy.SELECT_IN,
      schema: 'myschema',
    }).catch(() => {
      // Undefined if exception thrown
    });

    expect(r?.a?.id).not.toEqual(undefined);
  });
});
