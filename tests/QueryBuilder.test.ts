import { QueryBuilder } from '../lib/QueryBuilder';
import { EntityManager } from '../lib';

/**
 * @class QueryBuilderTest
 */
describe('QueryBuilder', () => {

  test('should load entities', async () => {
    const Mock = jest.fn<EntityManager>(() => ({
      entityFactory: jest.fn(),
      connection: jest.fn(),
    }));
    const em = new Mock();
    const qb = new QueryBuilder(em);
  });

});
