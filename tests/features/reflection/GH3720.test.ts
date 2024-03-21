import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

@Entity()
export class A {

  @PrimaryKey()
  id!: number;

  @Property()
  types!: string[];

}

let orm: MikroORM;

beforeAll(async () => {
  const logger = jest.fn();
  orm = await MikroORM.init({
    metadataCache: { enabled: false },
    logger,
    debug: true,
    entities: [A],
    dbName: 'mikro_orm_test_3720',
    metadataProvider: TsMorphMetadataProvider,
    discovery: { tsConfigPath: 'foobar.json' },
  });
  expect(logger).toHaveBeenCalledWith(expect.stringContaining('File not found:'));
  expect(logger).toHaveBeenCalledWith(expect.stringContaining('foobar.json'));

  await orm.schema.refreshDatabase();
});

afterAll(() => orm.close(true));

test('GH3720', async () => {
  await orm.em.findAndCount(A, {});
});
