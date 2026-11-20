import { Entity, MikroORM, PrimaryKey, Property, raw } from '@mikro-orm/sqlite';

@Entity()
class User {

  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property({ nullable: true })
  age?: number;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    entities: [User],
    dbName: ':memory:',
  });
  await orm.schema.createSchema();
});

beforeEach(async () => {
  await orm.schema.clearDatabase();
  orm.em.create(User, { id: 1, name: 'one', email: 'one?', age: 10 });
  orm.em.create(User, { id: 2, name: '?', email: 'two??', age: 20 });
  orm.em.create(User, { id: 3, name: 'three', email: 'th?ree', age: 30 });
  await orm.em.flush();
  orm.em.clear();
});

afterAll(async () => {
  await orm.close(true);
});

const error = /more placeholders than parameters/;
const ages = async () => (await orm.em.fork().find(User, {}, { orderBy: { id: 'asc' } })).map(u => u.age);

test('unknown keys containing question marks are rejected', async () => {
  const em = orm.em.fork();
  await expect(em.find(User, { $and: [{ 'u0.id??': 'x' }, { age: 10 }] } as any)).rejects.toThrow(error);
  await expect(em.find(User, { 'u0.id??': { $in: ['a', 'b'] }, 'name': 'x' } as any)).rejects.toThrow(error);
  await expect(em.find(User, { 'u0.id?': 1, 'name': 'x' } as any)).rejects.toThrow(error);
  await expect(em.createQueryBuilder(User, 'u').where({ 'u.name??': 'x', 'email': 'y' } as any).getResultList()).rejects.toThrow(error);
  await expect(em.nativeUpdate(User, { id: 1 }, { 'age??': 'x' } as any)).rejects.toThrow(error);
  await expect(em.createQueryBuilder(User).update({ 'age??': 'x' } as any).where({ id: 1 }).execute()).rejects.toThrow(error);
  await expect(em.nativeDelete(User, { 'user.id??': 'x', 'age': 10 } as any)).rejects.toThrow(error);
  await expect(em.insert(User, { 'id': 8, 'name': 'n', 'email': 'e', 'age??': 'x' } as any)).rejects.toThrow(error);
  await expect(em.insertMany(User, [
    { 'id': 8, 'name': 'n', 'email': 'e', 'age??': 'x' },
    { 'id': 9, 'name': 'n', 'email': 'e', 'age??': 'x' },
  ] as any)).rejects.toThrow(error);
  await expect(ages()).resolves.toEqual([10, 20, 30]);
});

test('values containing question marks', async () => {
  const em = orm.em.fork();
  await expect(em.find(User, { name: '?', email: 'two??' })).resolves.toMatchObject([{ id: 2 }]);
  await expect(em.find(User, { email: { $like: '%?%' } }, { orderBy: { id: 'asc' } })).resolves.toHaveLength(3);
  await expect(em.find(User, { [raw('lower(name)')]: '?', email: { $in: ['two??', 'th?ree'] } })).resolves.toMatchObject([{ id: 2 }]);
  await expect(em.createQueryBuilder(User, 'u').where(raw('lower(u.name) = ?', ['?'])).andWhere({ email: 'two??' }).getResultList()).resolves.toMatchObject([{ id: 2 }]);
  await expect(em.nativeUpdate(User, { email: 'th?ree' }, { name: '??' })).resolves.toBe(1);
  await em.insertMany(User, [{ id: 8, name: '?', email: '??' }, { id: 9, name: 'n?', email: 'e' }]);
  await expect(em.count(User, { name: { $in: ['?', '??', 'n?'] } })).resolves.toBe(4);
  await expect(em.execute('select ? as a, \'\\?\' as b', ['?'])).resolves.toEqual([{ a: '?', b: '?' }]);
});
