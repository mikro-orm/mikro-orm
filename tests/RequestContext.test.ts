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
      // access UoW via property so we do not get the one from request context automatically
      expect(em['unitOfWork'].getIdentityMap()).not.toBe(orm.em['unitOfWork'].getIdentityMap());
    });
    expect(RequestContext.currentRequestContext()).not.toBeNull();
    await new Promise(resolve => setTimeout(resolve, 100)); // wait for GC
    expect(RequestContext.currentRequestContext()).toBeNull();
  });

  afterAll(async () => orm.close(true));

});
