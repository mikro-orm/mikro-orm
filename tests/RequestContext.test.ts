import { RequestContext, MikroORM } from '../lib';
import { initORM, wipeDatabase } from './bootstrap';

/**
 * @class RequestContextTest
 */
describe('RequestContext', () => {

  let orm: MikroORM;

  beforeAll(async () => orm = await initORM());
  beforeEach(async () => wipeDatabase(orm.em));

  test('create new context', async () => {
    expect(RequestContext.getEntityManager()).toBeNull();
    RequestContext.create(orm.em, () => {
      const em = RequestContext.getEntityManager()!;
      expect(em).not.toBe(orm.em);
      expect(em['_unitOfWork']['identityMap']).not.toBe(orm.em['_unitOfWork']['identityMap']);
    });
  });

  afterAll(async () => orm.close(true));

});
