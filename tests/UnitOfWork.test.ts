import { UnitOfWork } from '../lib/UnitOfWork';
import { Author } from './entities/Author';
import { EntityManager, MikroORM } from '../lib';
import { initORM, wipeDatabase } from './bootstrap';

/**
 * @class UnitOfWorkTest
 */
describe('UnitOfWork', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORM());
  beforeEach(async () => wipeDatabase(orm.em));

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

  afterAll(async () => orm.close(true));

});
