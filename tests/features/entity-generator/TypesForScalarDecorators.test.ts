import { EntityGenerator } from '@mikro-orm/entity-generator';
import { MikroORM } from '@mikro-orm/mysql';

let orm: MikroORM;
beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: 'types_for_scalar_decorators',
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
    multipleStatements: true,
  });
  await orm.schema.ensureDatabase();
});

afterAll(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

describe('TypesForScalarDecorators', () => {
  test('generate entities from schema [mysql]', async () => {
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
    orm.config.get('entityGenerator').scalarTypeInDecorator = true;
    const dump = await orm.entityGenerator.generate();
    expect(dump).toMatchSnapshot('dump');
  });
});
