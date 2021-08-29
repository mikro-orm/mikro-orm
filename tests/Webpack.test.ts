import { BookWp, AuthorWp } from './entities-webpack';
import { BookWpI, AuthorWpI } from './entities-webpack-invalid';
import type { Options } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/core';

describe('Webpack', () => {

  test('should create entity', async () => {
    const orm = await MikroORM.init({
      dbName: `mikro_orm_test`,
      port: 3307,
      multipleStatements: true,
      type: 'mysql',
      discovery: { disableDynamicFileAccess: true },
      entities: [AuthorWp, BookWp],
    });

    expect(orm.getMetadata().has('BookWp')).toBe(true);
    expect(orm.getMetadata().has('AuthorWp')).toBe(true);
    const author = orm.em.create(AuthorWp, { name: 'Name' });
    expect(author).toBeInstanceOf(AuthorWp);
    expect(author.name).toBe('Name');

    await orm.close(true);
  });

  test('should throw error for invalid entities', async () => {
    const options = {
      dbName: `mikro_orm_test`,
      type: 'mysql',
      entities: [AuthorWpI, BookWpI],
      discovery: { disableDynamicFileAccess: true },
    } as Options;
    const err = `Please provide either 'type' or 'entity' attribute in AuthorWpI.books`;
    await expect(MikroORM.init(options)).rejects.toThrowError(err);
  });

  test('should throw error if entities is not defined', async () => {
    const options = {
      dbName: `mikro_orm_test`,
      type: 'mysql',
      entities: ['not/existing'],
      discovery: { disableDynamicFileAccess: true },
    } as Options;
    const err = `[requireEntitiesArray] Explicit list of entities is required, please use the 'entities' option.`;
    await expect(MikroORM.init(options)).rejects.toThrowError(err);
  });

});
