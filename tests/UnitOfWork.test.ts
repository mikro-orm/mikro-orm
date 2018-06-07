import { UnitOfWork } from '../lib/UnitOfWork';
import { Author } from './entities/Author';
import { EntityManager, MikroORM } from '../lib';

/**
 * @class UnitOfWorkTest
 */
describe('UnitOfWork', () => {

  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entitiesDirs: ['entities'],
      dbName: 'mikro-orm-test',
      baseDir: __dirname,
    });
  });

  test('should load entities', async () => {
    const Mock = jest.fn<EntityManager>(() => ({
      entityFactory: jest.fn(),
      connection: jest.fn(),
    }));
    const em = new Mock();
    const uow = new UnitOfWork(em);
    const a = new Author('test2', 'mail2@test.com');
    uow.addToIdentityMap(a);
  });

  afterAll(async () => {
    await orm.close(true);
  });

});
