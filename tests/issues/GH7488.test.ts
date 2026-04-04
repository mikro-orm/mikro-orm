import { MikroORM, ArrayType } from '@mikro-orm/sqlite';
import { Entity, PrimaryKey, Property, ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';

@Entity()
class Test {
  @PrimaryKey()
  id!: number;

  @Property({ type: ArrayType, nullable: true })
  names?: string[] | null;
}

describe('GH issue 7488', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      entities: [Test],
      dbName: ':memory:',
    });

    await orm.schema.refresh();
  });

  beforeEach(async () => {
    await orm.em.createQueryBuilder(Test).truncate().execute();
    orm.em.clear();
  });

  afterAll(() => orm.close(true));

  test('array values containing commas should be preserved', async () => {
    orm.em.create(Test, { names: ['hello,world', 'hello'] });
    await orm.em.flush();
    orm.em.clear();

    const [loaded] = await orm.em.find(Test, {});
    expect(loaded.names).toEqual(['hello,world', 'hello']);
  });

  test('array values without commas still work', async () => {
    orm.em.create(Test, { names: ['hello', 'world'] });
    await orm.em.flush();
    orm.em.clear();

    const [loaded] = await orm.em.find(Test, {});
    expect(loaded.names).toEqual(['hello', 'world']);
  });

  test('array values containing double quotes should be preserved', async () => {
    orm.em.create(Test, { names: ['say "hi"', 'normal'] });
    await orm.em.flush();
    orm.em.clear();

    const [loaded] = await orm.em.find(Test, {});
    expect(loaded.names).toEqual(['say "hi"', 'normal']);
  });

  test('array values containing backslashes should be preserved', async () => {
    orm.em.create(Test, { names: ['path\\to', 'file'] });
    await orm.em.flush();
    orm.em.clear();

    const [loaded] = await orm.em.find(Test, {});
    expect(loaded.names).toEqual(['path\\to', 'file']);
  });

  test('empty array should work', async () => {
    orm.em.create(Test, { names: [] });
    await orm.em.flush();
    orm.em.clear();

    const [loaded] = await orm.em.find(Test, {});
    expect(loaded.names).toEqual([]);
  });

  test('unquoted values before quoted ones should be preserved', async () => {
    orm.em.create(Test, { names: ['hello', 'world,foo'] });
    await orm.em.flush();
    orm.em.clear();

    const [loaded] = await orm.em.find(Test, {});
    expect(loaded.names).toEqual(['hello', 'world,foo']);
  });

  test('null array should work', async () => {
    orm.em.create(Test, { names: null });
    await orm.em.flush();
    orm.em.clear();

    const [loaded] = await orm.em.find(Test, {});
    expect(loaded.names).toBeNull();
  });
});
