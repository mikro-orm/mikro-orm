import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

test('IntervalTypeGen', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'IntervalTypeGen',
    discovery: {
      warnWhenNoEntities: false,
    },
    ensureDatabase: false,
    extensions: [EntityGenerator],
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(`
CREATE TABLE "public"."range" (
    "id" serial,
    "start" timestamptz,
    "duration" interval,
    "aftermath" interval(6),
    "cooldown" interval(0),
    PRIMARY KEY ("id")
);
  `);
  }

  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot();
  await orm.close(true);
});
