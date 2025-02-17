import { EntityMetadata, MikroORM } from '@mikro-orm/sqlite';
import { initORMSqlite } from '../../bootstrap.js';

describe('CustomBase', () => {
  let orm: MikroORM;

  beforeEach(async () => {
    orm = await initORMSqlite();
    orm.config.get('entityGenerator').coreImportsPrefix = 'MikroORM_';
    orm.config.get('entityGenerator').onInitialMetadata = (metadata, platform) => {
      const baseEntity2 = new EntityMetadata({
        className: 'BaseEntity2',
        abstract: true,
        relations: [],
        properties: {},
      });
      baseEntity2.addProperty({
          name: 'serverTime',
          runtimeType: 'Date',
          type: 'datetime',
          columnTypes: ['DATETIME'],
          fieldNames: ['server_time'],
          formula: () => 'SELECT NOW()',
      });
      metadata.push(baseEntity2);
    };
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

      describe.each(['', 'CustomBase', 'BaseEntity2', 'BaseEntity'])('customBaseEntityName=%s', (customBaseEntityName: string) => {
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
