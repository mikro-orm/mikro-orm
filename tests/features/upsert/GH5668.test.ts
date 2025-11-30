import { MikroORM, sql } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider, Unique } from '@mikro-orm/decorators/legacy';

@Entity()
@Unique({
  name: 'a_null',
  expression: 'create unique index a_null on `a` (`z`, `y`) where `x` is null',
})
@Unique({
  name: 'a_non_null',
  expression: 'create unique index a_non_null on `a` (`z`, `y`, `x`) where `x` is not null',
})
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
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    entities: [A],
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('5668', async () => {
  const em = orm.em.fork();

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
