import { Entity, Formula, PrimaryKey, Property, MikroORM } from '@mikro-orm/postgresql';

@Entity({ schema: '*' })
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ unique: true })
  email!: string;

  @Formula(
    table => `(select ${table.schema}.user.id from ${table.schema}.user where ${table.alias}.id = 1)`,
    { lazy: true },
  )
  baz?: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'mikro_orm_test_gh_7102',
    entities: [User],
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('formula should support a schema parameter', async () => {
  const em = orm.em.fork({ schema: 'theSpecificSchema' });
  const qb = em.createQueryBuilder(User).select(['name', 'baz']);
  const sql = qb.getFormattedQuery();

  // Schema should be present in the formula (not undefined)
  expect(sql).not.toContain('undefined');
  expect(sql).toContain('theSpecificSchema.user.id');
});
