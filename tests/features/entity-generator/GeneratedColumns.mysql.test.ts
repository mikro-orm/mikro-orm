import { MikroORM, Utils } from '@mikro-orm/mysql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schemaName = 'generated_columns_example';
const schema = `
  CREATE TABLE IF NOT EXISTS \`allowed_ages_at_creation\`
  (
    \`age\`
    TINYINT
    UNSIGNED
    NOT
    NULL,
    PRIMARY
    KEY
  (
    \`age\`
  )
    )
    ENGINE = InnoDB;

  CREATE TABLE IF NOT EXISTS \`users\`
  (
    \`id\`
    INT
    UNSIGNED
    NOT
    NULL
    AUTO_INCREMENT,
    \`first_name\`
    VARCHAR
  (
    100
  ) NOT NULL,
    \`last_name\` VARCHAR
  (
    100
  ) NOT NULL,
    \`full_name\` VARCHAR
  (
    200
  ) GENERATED ALWAYS AS
  (
    CONCAT
  (
    \`first_name\`,
    ' ',
    \`last_name\`
  )) VIRTUAL NOT NULL,
    \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`date_of_birth\` DATE NOT NULL,
    \`age_at_creation\` TINYINT UNSIGNED GENERATED ALWAYS AS
  (
    TIMESTAMPDIFF
  (
    YEAR,
    \`date_of_birth\`,
    \`created_at\`
  )) STORED NULL,
    PRIMARY KEY
  (
    \`id\`
  ),
    INDEX \`fk_users_allowed_ages_at_creation_idx\`
  (
    \`age_at_creation\`
    ASC
  ) VISIBLE,
    CONSTRAINT \`fk_users_allowed_ages_at_creation\`
    FOREIGN KEY
  (
    \`age_at_creation\`
  )
    REFERENCES \`allowed_ages_at_creation\`
  (
    \`age\`
  )
    ON DELETE CASCADE
    ON UPDATE RESTRICT
    )
    ENGINE = InnoDB;
`;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: schemaName,
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
    multipleStatements: true,
    ensureDatabase: false,
  });

  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(schema);
  }
});

afterAll(async () => {
  await orm.close(true);
});

describe(schemaName, () => {
  describe.each(['decorators', 'entitySchema'] as const)('%s', entityDefinition => {
    test('generates from db', async () => {
      const dump = await orm.entityGenerator.generate({ entityDefinition });
      expect(dump).toMatchSnapshot('dump');
    });

    test('as functions from extensions', async () => {
      const dump = await orm.entityGenerator.generate({
        entityDefinition,
        onInitialMetadata: metadata => {
          const usersMeta = metadata.find(meta => meta.className === 'Users')!;
          Object.entries(usersMeta.properties).forEach(([propName, propOptions]) => {
            if (typeof propOptions.generated === 'string') {
              propOptions.generated = Utils.createFunction(
                new Map(),
                `return () => ${JSON.stringify(propOptions.generated)}`,
              );
            }
          });
        },
      });
      expect(dump).toMatchSnapshot('dump');
    });
  });
});
