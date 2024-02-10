import { MikroORM } from '@mikro-orm/mysql';
import { initORMMySql } from '../../bootstrap';


describe('CustomBase', () => {
  let orm: MikroORM;
  beforeEach(async () => {
    orm = await initORMMySql('mysql', {}, true);
  });

  afterEach(async () => {
    await orm.close(true);
  });

  describe.each([true, false])('forceObject=%s', forceObject => {
    beforeEach(() => {
      orm.config.get('serialization').forceObject = forceObject;
    });

    describe.each([true, false])('useCoreBaseEntity=%s', useCoreBaseEntity => {
      beforeEach(() => {
        orm.config.get('entityGenerator').useCoreBaseEntity = useCoreBaseEntity;
      });

      describe.each(['', 'CustomBase', 'BaseUser2', 'BaseEntity'])('customBaseEntityName=%s', (customBaseEntityName: string) => {
        beforeEach(() => {
          orm.config.get('entityGenerator').customBaseEntityName = customBaseEntityName;
        });

        test.each([true, false])('entitySchema=%s', async entitySchema => {
          orm.config.get('entityGenerator').entitySchema = entitySchema;

          const dump = await orm.entityGenerator.generate();
          expect(dump).toMatchSnapshot('dump');
        });
      });
    });
  });
});
