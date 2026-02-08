import { MikroORM } from '@mikro-orm/mysql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schemaName = 'fk_shared_with_column_example';
const schema = `
CREATE TABLE IF NOT EXISTS \`countries\` (
  \`code\` CHAR(2) NOT NULL,
  PRIMARY KEY (\`code\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`legal_user_countries\` (
  \`country\` CHAR(2) NOT NULL,
  PRIMARY KEY (\`country\`),
  CONSTRAINT \`fk_legal_user_countries_countries1\`
    FOREIGN KEY (\`country\`)
    REFERENCES \`countries\` (\`code\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`users\` (
  \`user_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`user_country\` CHAR(2) NOT NULL,
  \`user_country_born\` CHAR(2) NOT NULL,
  PRIMARY KEY (\`user_id\`),
  INDEX \`fk_users_countries_idx\` (\`user_country\` ASC) VISIBLE,
  INDEX \`fk_users_countries1_idx\` (\`user_country_born\` ASC) VISIBLE,
  CONSTRAINT \`user_country\`
    FOREIGN KEY (\`user_country\`)
    REFERENCES \`countries\` (\`code\`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT,
  CONSTRAINT \`user_country__is_legal\`
    FOREIGN KEY (\`user_country\`)
    REFERENCES \`legal_user_countries\` (\`country\`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT \`user_country_born\`
    FOREIGN KEY (\`user_country_born\`)
    REFERENCES \`countries\` (\`code\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
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
  describe.each(['never', 'always', 'smart'] as const)('scalarPropertiesForRelations=%s', scalarPropertiesForRelations => {
    describe.each([true, false])('bidirectionalRelations=%s', bidirectionalRelations => {
      describe.each([true, false])('identifiedReferences=%s', identifiedReferences => {
        test.each(['entitySchema', 'decorators'] as const)('entityDefinition=%s', async entityDefinition => {
          const dump = await orm.entityGenerator.generate({
            scalarPropertiesForRelations,
            bidirectionalRelations,
            identifiedReferences,
            entityDefinition,
          });
          expect(dump).toMatchSnapshot('dump');
        });
      });
    });
  });
});
