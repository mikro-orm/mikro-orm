import { ArrayType, Entity, LoadStrategy, ManyToOne, MikroORM, PrimaryKey, Property, wrap } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

@Entity()
export class User {

  @PrimaryKey()
  id!: number;

  @Property({ type: ArrayType })
  groups!: readonly string[];

}

describe('GH issue 2679', () => {

  let orm: MikroORM<PostgreSqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [User],
      dbName: 'mikro_orm_test_gh_2679',
      driver: PostgreSqlDriver,
    });

    await orm.schema.refreshDatabase();
  });

  beforeEach(async () => {
    await orm.em.createQueryBuilder(User).truncate().execute();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('should be able to have an empty string alone', async () => {
    const create = orm.em.create(User, {
      groups: [''],
    });
    await orm.em.persistAndFlush(create);
    orm.em.clear();

    const loaded = (await orm.em.find(User, {}))[0];
    expect(loaded.groups).toEqual(['']);
  });

  test('should be able to have an empty string at the start', async () => {
    const create = orm.em.create(User, {
      groups: ['', 'foo', 'bar'],
    });
    await orm.em.persistAndFlush(create);
    orm.em.clear();

    const loaded = (await orm.em.find(User, {}))[0];
    expect(loaded.groups).toEqual(['', 'foo', 'bar']);
  });

  test('should be able to have an empty string at the end', async () => {
    const create = orm.em.create(User, {
      groups: ['foo', 'bar', ''],
    });
    await orm.em.persistAndFlush(create);
    orm.em.clear();

    const loaded = (await orm.em.find(User, {}))[0];
    expect(loaded.groups).toEqual(['foo', 'bar', '']);
  });

  test('should be able to have an empty string in the middle', async () => {
    const create = orm.em.create(User, {
      groups: ['foo', '', 'bar'],
    });
    await orm.em.persistAndFlush(create);
    orm.em.clear();

    const f2 = orm.em.fork();
    const loaded = (await f2.find(User, {}))[0];
    expect(loaded.groups).toEqual(['foo', '', 'bar']);
  });

  test('should be able to have multiple empty strings', async () => {
    const create = orm.em.create(User, {
      groups: ['', 'foo', '', 'bar', ''],
    });
    await orm.em.persistAndFlush(create);
    orm.em.clear();

    const loaded = (await orm.em.find(User, {}))[0];
    expect(loaded.groups).toEqual(['', 'foo', '', 'bar', '']);
  });

  test('special chars in array items (#3037)', async () => {
    const create = orm.em.create(User, {
      groups: ['', 'f{o}o', '', '{bar}', ''],
    });
    await orm.em.persistAndFlush(create);
    orm.em.clear();

    const loaded = (await orm.em.find(User, {}))[0];
    expect(loaded.groups).toEqual(['', 'f{o}o', '', '{bar}', '']);
  });

  test('special chars in array items (#3037) - With double quotes', async () => {
    const create = orm.em.create(User, {
      groups: ['', 'f"o', '', '"bar"', ''],
    });
    await orm.em.persistAndFlush(create);
    orm.em.clear();

    const loaded = (await orm.em.find(User, {}))[0];
    expect(loaded.groups).toEqual(['', 'f"o', '', '"bar"', '']);
  });
});
