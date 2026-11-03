import { MikroORM } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({ entities: [User], dbName: ':memory:', metadataProvider: ReflectMetadataProvider });
  await orm.schema.create();
  orm.em.create(User, { name: 'u1' });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(() => orm.close(true));

const error = /Query comments cannot contain '\/\*', '\*\/' or '\?'/;

test('plain comments are emitted', async () => {
  const em = orm.em.fork();
  const qb = em
    .createQueryBuilder(User, 'u')
    .select('*')
    .where({ name: 'u1' })
    .comment('fetch users')
    .hintComment('MAX_EXECUTION_TIME(1000)');
  expect(qb.getFormattedQuery()).toBe(
    "/* fetch users */ select /*+ MAX_EXECUTION_TIME(1000) */ `u`.* from `user` as `u` where `u`.`name` = 'u1'",
  );
  await expect(qb.getResultList()).resolves.toHaveLength(1);
  await expect(em.find(User, {}, { comments: ['a', 'b'], hintComments: 'c' })).resolves.toHaveLength(1);
});

test('comments cannot terminate the comment block', async () => {
  const em = orm.em.fork();
  expect(() => em.createQueryBuilder(User).select('*').comment('x */ select 1 -- ').getQuery()).toThrow(error);
  expect(() => em.createQueryBuilder(User).select('*').comment('x /* y').getQuery()).toThrow(error);
  expect(() => em.createQueryBuilder(User).select('*').hintComment('x */ select 1 -- ').getQuery()).toThrow(error);
  expect(() => em.createQueryBuilder(User).select('*').hintComment(['ok', 'x /* y']).getQuery()).toThrow(error);
  await expect(em.find(User, {}, { comments: ['x */ delete from user -- '] })).rejects.toThrow(error);
  await expect(em.find(User, {}, { hintComments: 'x */ delete from user -- ' })).rejects.toThrow(error);
  await expect(em.count(User, {}, { comments: 'x */ delete from user -- ' })).rejects.toThrow(error);
  await expect(em.findAndCount(User, {}, { hintComments: ['x */ delete from user -- '] })).rejects.toThrow(error);
});

test('comments cannot contain a parameter placeholder', async () => {
  const em = orm.em.fork();
  // a `?` inside the comment would consume a bound parameter and shift every following one
  expect(() => em.createQueryBuilder(User).select('*').where({ name: 'u1' }).comment('why?').getQuery()).toThrow(error);
  expect(() => em.createQueryBuilder(User).select('*').hintComment('why?').getQuery()).toThrow(error);
  await expect(em.find(User, { name: 'u1' }, { comments: 'why?' })).rejects.toThrow(error);
});

test('native query builder validates comments too', () => {
  const qb = orm.em.getPlatform().createNativeQueryBuilder();
  expect(() => qb.comment('x */')).toThrow(error);
  expect(() => qb.hintComment('x ?')).toThrow(error);
});
