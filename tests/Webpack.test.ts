import { BookWp, AuthorWp } from './entities-webpack';
import { BookWpI, AuthorWpI } from './entities-webpack-invalid';
import { MikroORM } from '../lib';
import { wipeDatabase, BASE_DIR, wipeDatabaseMySqlWp } from './bootstrap';
import { MetadataDiscovery } from '../lib/metadata';

describe('Webpack', () => {
  let port = 3307;
  if (process.env.ORM_PORT) {
    port = +process.env.ORM_PORT;
  }

  beforeAll(() => {
    process.env.WEBPACK = 'true';
  });

  afterAll(() => {
    delete process.env.WEBPACK;
  });

  test('should load entities', async () => {
    const orm = await MikroORM.init({
      dbName: `mikro_orm_test`,
      port,
      baseDir: BASE_DIR,
      debug: ['query'],
      highlight: false,
      logger: i => i,
      multipleStatements: true,
      type: 'mysql',
      cache: { enabled: false },
      entities: [AuthorWp, BookWp],
    });

    const metadataStorage: any = await new MetadataDiscovery(
      orm.getMetadata(),
      orm.em.getDriver().getPlatform(),
      orm.config,
      orm.config.getLogger(),
    ).discover();

    const imports = Object.keys(metadataStorage.metadata);

    expect(imports.includes('BookWp')).toBeTruthy();
    expect(imports.includes('AuthorWp')).toBeTruthy();

    await orm.close(true);
  });

  test('should create entity', async () => {
    const orm = await MikroORM.init({
      dbName: `mikro_orm_test`,
      port,
      baseDir: BASE_DIR,
      debug: ['query'],
      highlight: false,
      logger: i => i,
      multipleStatements: true,
      type: 'mysql',
      cache: { enabled: false },
      entities: [AuthorWp, BookWp],
    });

    const author = orm.em.create(AuthorWp, {name: 'Name'});
    expect(author).toBeInstanceOf(AuthorWp);
    expect(author.name).toBe('Name');
  });

  test('should throw error for invalid entities', async done => {
    MikroORM.init({
      dbName: `mikro_orm_test`,
      port,
      baseDir: BASE_DIR,
      debug: ['query'],
      highlight: false,
      logger: i => i,
      multipleStatements: true,
      type: 'mysql',
      cache: { enabled: false },
      entities: [AuthorWpI, BookWpI],
    }).catch((e: Error) => {
      expect(e.message).toBe(
        "Webpack bundling requires either 'type' or 'entity' attributes to be set in @Property decorators. (AuthorWpI.AuthorWpI)",
      );
      done();
    });
  });

  test('should throw error if entities is not defined', async done => {
    MikroORM.init({
      dbName: `mikro_orm_test`,
      port,
      baseDir: BASE_DIR,
      debug: ['query'],
      highlight: false,
      logger: i => i,
      multipleStatements: true,
      type: 'mysql',
      cache: { enabled: false },
      entitiesDirs: ['not/existing'],
    }).catch((e: Error) => {
      expect(e.message).toBe(
        "Webpack bundles only supports pre-defined entities. Please use the 'entities' option. See the documentation for more information.",
      );
      done();
    });
  });
});
