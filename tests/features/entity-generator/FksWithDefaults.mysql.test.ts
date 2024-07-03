import { MikroORM, MikroORMOptions } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schemaName = 'fk_defaults_example';
const schema = `
CREATE TABLE IF NOT EXISTS \`currency\` (
  \`code\` CHAR(3) NOT NULL,
  \`is_enabled\` TINYINT(1) NOT NULL,
  PRIMARY KEY (\`code\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`wallet_type\` (
  \`currency\` CHAR(3) NOT NULL DEFAULT 'EUR',
  \`type\` CHAR(1) NOT NULL,
  PRIMARY KEY (\`currency\`, \`type\`),
  CONSTRAINT \`fk_wallet_type_currency1\`
    FOREIGN KEY (\`currency\`)
    REFERENCES \`currency\` (\`code\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`wallet_meta\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`currency\` CHAR(3) NOT NULL DEFAULT 'EUR',
  \`type\` CHAR(1) NOT NULL DEFAULT 'A',
  PRIMARY KEY (\`id\`),
  INDEX \`fk_wallet_wallet_type_idx\` (\`currency\` ASC, \`type\` ASC) VISIBLE,
  CONSTRAINT \`fk_wallet_wallet_type\`
    FOREIGN KEY (\`currency\` , \`type\`)
    REFERENCES \`wallet_type\` (\`currency\` , \`type\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`wallet_contents\` (
  \`id\` INT UNSIGNED NOT NULL,
  \`balance\` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (\`id\`),
  CONSTRAINT \`fk_wallet_contents_wallet_meta1\`
    FOREIGN KEY (\`id\`)
    REFERENCES \`wallet_meta\` (\`id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
`;

beforeAll(async () => {
  orm = await MikroORM.init({
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
  await orm.close(true);
});

beforeEach(async () => {
  orm = await MikroORM.init({
    dbName: schemaName,
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
    multipleStatements: true,
  });
});

afterEach(async () => {
  await orm.close(true);
});

describe(schemaName, () => {
  describe.each(['never', 'always', 'smart'])('scalarPropertiesForRelations=%s', i => {
    const scalarPropertiesForRelations = i as NonNullable<MikroORMOptions['entityGenerator']['scalarPropertiesForRelations']>;
    beforeEach(() => {
      orm.config.get('entityGenerator').scalarPropertiesForRelations = scalarPropertiesForRelations;
    });

    describe.each([true, false])('bidirectionalRelations=%s', bidirectionalRelations => {
      beforeEach(() => {
        orm.config.get('entityGenerator').bidirectionalRelations = bidirectionalRelations;
      });

      describe.each([true, false])('identifiedReferences=%s', identifiedReferences => {
        beforeEach(() => {
          orm.config.get('entityGenerator').identifiedReferences = identifiedReferences;
        });

        describe.each([true, false])('esmImport=%s', esmImport => {
          beforeEach(() => {
            orm.config.get('entityGenerator').esmImport = esmImport;
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
});
