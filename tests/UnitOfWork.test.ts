import { UnitOfWork } from '../lib/UnitOfWork';
import { Author } from './entities/Author';
import { EntityManager } from '../lib';

/**
 * @class UnitOfWorkTest
 */
describe('UnitOfWork', () => {

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

});
