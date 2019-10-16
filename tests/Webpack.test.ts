import { BookWp, AuthorWp } from './entities-webpack';
import { BookWpI, AuthorWpI } from './entities-webpack-invalid';
import { MikroORM, Options } from '../lib';

describe('Webpack', () => {

  beforeAll(() => {
    process.env.WEBPACK = 'true';
  });

  afterAll(() => {
    delete process.env.WEBPACK;
  });

  test('should create entity', async () => {
    let port = 3307;

    if (process.env.ORM_PORT) {
      port = +process.env.ORM_PORT;
    }

    const orm = await MikroORM.init({
      dbName: `mikro_orm_test`,
      port,
      multipleStatements: true,
      type: 'mysql',
      cache: { enabled: false },
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
    } as Options;
    const err = `Webpack bundling requires either 'type' or 'entity' attributes to be set in @Property decorators. (AuthorWpI.id)`;
    await expect(MikroORM.init(options)).rejects.toThrowError(err);
  });

  test('should throw error if entities is not defined', async () => {
    const options = {
      dbName: `mikro_orm_test`,
      type: 'mysql',
      entitiesDirs: ['not/existing'],
    } as Options;
    const err = `Webpack bundling only supports pre-defined entities. Please use the 'entities' option. See the documentation for more information.`;
    await expect(MikroORM.init(options)).rejects.toThrowError(err);
  });

});
