import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { isSubquery } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/sqlite';

@Entity()
class DepartmentLink {
  @PrimaryKey()
  id!: number;

  @Property()
  departmentId!: number;

  @Property({ type: 'bigint' })
  groupId!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    entities: [DepartmentLink],
    dbName: ':memory:',
  });
  await orm.schema.create();
  await orm.em.insertMany(DepartmentLink, [
    { id: 1, departmentId: 10, groupId: '1' },
    { id: 2, departmentId: 11, groupId: '1' },
    { id: 3, departmentId: 12, groupId: '2' },
  ]);
});

afterAll(() => orm.close(true));

test('$in with a sub-query on a bigint property', async () => {
  const em = orm.em.fork();
  const groupIds = em.createQueryBuilder(DepartmentLink).select('groupId').where({ departmentId: 10 });
  const qb = em
    .createQueryBuilder(DepartmentLink)
    .select('departmentId')
    .where({ groupId: { $in: groupIds } })
    .orderBy({ departmentId: 'asc' });

  expect(qb.getFormattedQuery()).not.toContain('[object Object]');
  const rows = await qb.execute();
  expect(rows.map(row => row.departmentId)).toEqual([10, 11]);
});

test('sub-query detection cannot be spoofed by a plain object', () => {
  const em = orm.em.fork();
  const qb = em.createQueryBuilder(DepartmentLink).select('groupId');
  expect(isSubquery(qb)).toBe(true);
  expect(isSubquery(qb.getNativeQuery())).toBe(true);
  expect(isSubquery({ __subquery: true })).toBe(false);
  expect(isSubquery({ toRaw: () => qb.toRaw() })).toBe(false);
  expect(isSubquery(JSON.parse('{"__subquery":true}'))).toBe(false);
});
