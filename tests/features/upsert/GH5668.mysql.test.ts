import { Entity, MikroORM, PrimaryKey, Property, sql } from '@mikro-orm/mysql';

@Entity()
class A {

  @PrimaryKey()
  id!: number;

  @Property({ nullable: true })
  x?: string;

  @Property()
  y!: string;

  @Property()
  z!: string;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    port: 3308,
    entities: [A],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('5668', async () => {
  await orm.em.insertMany(A, [
    { y: 'y1', z: 'z1' },
    { y: 'y2', z: 'z2', x: 'x2' },
  ]);

  await orm.em.fork().upsert(
    A,
    { y: 'y1', z: 'z1' },
    {
      onConflictFields: sql`(z, y) where x is null`,
      onConflictAction: 'merge',
      onConflictMergeFields: ['z'],
    },
  );

  await orm.em.fork().upsertMany(
    A,
    [{ y: 'y1', z: 'z1' }],
    {
      onConflictFields: sql`(z, y) where x is null`,
      onConflictAction: 'ignore',
      onConflictMergeFields: ['z'],
    },
  );

  await orm.em.fork().qb(A)
    .insert({ y: 'y1', z: 'z1' })
    .onConflict(sql`(z, y) where x is null`)
    .merge()
    .returning('id')
    .execute();
});
