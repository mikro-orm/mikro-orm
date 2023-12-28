import { MikroORM, MikroORMOptions } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schemaName = 'non_composite_ambiguous_fk_example';
const schema = `
CREATE TABLE IF NOT EXISTS \`products\` (
  \`product_id\` INT UNSIGNED NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`product_id\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`manufactured_products\` (
  \`product_id\` INT UNSIGNED NOT NULL,
  \`place\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`product_id\`),
  CONSTRAINT \`fk_manufactured_products_products1\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`products\` (\`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`deliverable_products\` (
  \`product_id\` INT UNSIGNED NOT NULL,
  \`starting_at\` DATETIME NOT NULL,
  PRIMARY KEY (\`product_id\`),
  CONSTRAINT \`fk_deliverable_products_products1\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`products\` (\`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`destinations\` (
  \`destination_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`destination_id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`shippable_products\` (
  \`product_id\` INT UNSIGNED NOT NULL,
  \`destination\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`product_id\`),
  INDEX \`fk_shippable_products_destinations1_idx\` (\`destination\` ASC) KEY_BLOCK_SIZE = 2 VISIBLE,
  INDEX \`fk_shippable_products_destinations1_idx2\` (\`destination\` ASC) KEY_BLOCK_SIZE = 10 VISIBLE,
  CONSTRAINT \`fk_shippable_products_manufactured_products\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`manufactured_products\` (\`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_shippable_products_deliverable_products1\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`deliverable_products\` (\`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_shippable_products_manufactured_products1\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`manufactured_products\` (\`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_shippable_products_destinations1\`
    FOREIGN KEY (\`destination\`)
    REFERENCES \`destinations\` (\`name\`)
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
  });
  const driver = orm.config.getDriver();
  if (!await driver.getPlatform().getSchemaHelper()?.databaseExists(driver.getConnection(), schemaName)) {
    await orm.schema.createSchema({ schema: schemaName });
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

        test.each([true, false])('entitySchema=%s', async entitySchema => {
          orm.config.get('entityGenerator').entitySchema = entitySchema;

          const dump = await orm.entityGenerator.generate();
          expect(dump).toMatchSnapshot('dump');
        });
      });
    });
  });
});
