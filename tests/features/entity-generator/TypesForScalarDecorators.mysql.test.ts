import { EntityGenerator } from '@mikro-orm/entity-generator';
import { MikroORM } from '@mikro-orm/mysql';

let orm: MikroORM;
const schemaName = 'types_for_scalar_decorators';

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: schemaName,
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
    multipleStatements: true,
    ensureDatabase: false,
  });
});

afterAll(() => orm.close());

test('TypesForScalarDecorators', async () => {
  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(`
CREATE TABLE IF NOT EXISTS \`users\`
(
  \`user_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`username\` VARCHAR(255) NOT NULL,
  \`views\` BIGINT UNSIGNED NOT NULL,
  \`enabled\` TINYINT(1) NOT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`user_id\`)
)
`);
  }
  orm.config.get('entityGenerator').scalarTypeInDecorator = true;
  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot('dump');
});
