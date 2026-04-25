import { MikroORM } from '@mikro-orm/sqlite';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

test('column-level collation is emitted by entity generator', async () => {
  const orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: ':memory:',
    discovery: {
      warnWhenNoEntities: false,
    },
    extensions: [EntityGenerator],
  });
  await orm.schema.execute(`
    create table "book" (
      "id" integer not null primary key autoincrement,
      "code" varchar(26) not null collate NOCASE,
      "name" varchar not null
    );
  `);
  const dump = await orm.entityGenerator.generate({ entityDefinition: 'decorators' });
  expect(dump.join('\n')).toContain("collation: 'NOCASE'");
  await orm.close(true);
});
