import { Entity, MikroORM, PrimaryKey } from '@mikro-orm/postgresql';

@Entity()
class ExampleEntity {

  @PrimaryKey()
  id!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: '6949',
    entities: [ExampleEntity],
  });
  await orm.schema.ensureDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

// FIXME candiate for knex compat package tests
test.skip('GH #6949', async () => {
  // const knex = orm.em.getKnex();
  // await knex.schema.dropTableIfExists('my-table');
  // await knex.transaction(async t => {
  //   await t.schema.createTable('my-table', table => {
  //     table.string('id', 100).primary();
  //   });
  //   await t.schema.alterTable('my-table', table => {
  //     table.string('id', 50).alter();
  //   });
  // });
});
