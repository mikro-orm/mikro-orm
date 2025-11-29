import { BookWp, AuthorWp } from './entities-webpack/index.js';
import { BookWpI, AuthorWpI } from './entities-webpack-invalid/index.js';
import type { Options } from '@mikro-orm/core';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { MikroORM } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';

describe('Webpack', () => {

  test('should create entity', async () => {
    const orm = await MikroORM.init({
      metadataProvider: ReflectMetadataProvider,
      dbName: `mikro_orm_test`,
      port: 3308,
      multipleStatements: true,
      driver: MySqlDriver,
      entities: [AuthorWp, BookWp],
    });

    expect(orm.getMetadata().has('BookWp')).toBe(true);
    expect(orm.getMetadata().has('AuthorWp')).toBe(true);
    const author = orm.em.create(AuthorWp, { name: 'Name', email: 'abc' });
    expect(author).toBeInstanceOf(AuthorWp);
    expect(author.name).toBe('Name');

    await orm.close(true);
  });

  test('should throw error for invalid entities', async () => {
    const options = {
      dbName: `mikro_orm_test`,
      metadataProvider: ReflectMetadataProvider,
      driver: MySqlDriver,
      entities: [AuthorWpI, BookWpI],
    } as Options;
    const err = `Please provide either 'type' or 'entity' attribute in AuthorWpI.books. Make sure you have 'emitDecoratorMetadata' enabled in your tsconfig.json.`;
    await expect(MikroORM.init(options)).rejects.toThrow(err);
  });

  test('should throw error if entities is not defined', async () => {
    const options = {
      dbName: `mikro_orm_test`,
      metadataProvider: ReflectMetadataProvider,
      driver: MySqlDriver,
      entities: ['not/existing'],
      discovery: { requireEntitiesArray: true },
    } as Options;
    const err = `[requireEntitiesArray] Explicit list of entities is required, please use the 'entities' option.`;
    await expect(MikroORM.init(options)).rejects.toThrow(err);
  });

  test('should throw error if entities is not defined', async () => {
    const options = {
      dbName: `mikro_orm_test`,
      metadataProvider: ReflectMetadataProvider,
      driver: MySqlDriver,
      entities: ['not/existing'],
    } as Options;
    const err = 'Folder based discovery requires the async `MikroORM.init()` method.';
    expect(() => new MikroORM(options)).toThrow(err);
  });

});
