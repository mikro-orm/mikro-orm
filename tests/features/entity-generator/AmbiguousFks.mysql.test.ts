import { MikroORM } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schemaName = 'ambiguous_fk_example';
const schema = `
CREATE TABLE IF NOT EXISTS \`products\` (
  \`product_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`product_id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`colors\` (
  \`color_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`color_id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`product_colors\` (
  \`color_id\` INT UNSIGNED NOT NULL,
  \`product_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (\`color_id\`, \`product_id\`),
  INDEX \`fk_product_colors_products1_idx\` (\`product_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_product_colors_colors1\`
    FOREIGN KEY (\`color_id\`)
    REFERENCES \`colors\` (\`color_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_product_colors_products1\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`products\` (\`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`product_sizes\` (
  \`product_id\` INT UNSIGNED NOT NULL,
  \`size\` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (\`product_id\`),
  UNIQUE INDEX \`size__product_id-UNIQUE\` (\`size\` ASC, \`product_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_product_sizes_products1\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`products\` (\`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`countries\` (
  \`country\` CHAR(2) NOT NULL,
  PRIMARY KEY (\`country\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`sellers\` (
  \`seller_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`seller_id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`seller_countries\` (
  \`country\` CHAR(2) NOT NULL,
  \`seller_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`country\`, \`seller_id\`),
  INDEX \`fk_seller_countries_sellers1_idx\` (\`seller_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_seller_countries_countries1\`
    FOREIGN KEY (\`country\`)
    REFERENCES \`countries\` (\`country\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_seller_countries_sellers1\`
    FOREIGN KEY (\`seller_id\`)
    REFERENCES \`sellers\` (\`seller_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`seller_products\` (
  \`seller_id\` INT UNSIGNED NOT NULL,
  \`product_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`seller_id\`, \`product_id\`),
  INDEX \`fk_seller_products_products1_idx\` (\`product_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_seller_products_sellers1\`
    FOREIGN KEY (\`seller_id\`)
    REFERENCES \`sellers\` (\`seller_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_seller_products_products1\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`products\` (\`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`product_countries\` (
  \`country\` CHAR(2) NOT NULL,
  \`product_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`country\`, \`product_id\`),
  INDEX \`fk_product_countries_product_sizes1_idx\` (\`product_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_product_countries_countries\`
    FOREIGN KEY (\`country\`)
    REFERENCES \`countries\` (\`country\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_product_countries_product_sizes1\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`product_sizes\` (\`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`sales\` (
  \`sale_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`country\` CHAR(2) NOT NULL,
  \`seller_id\` INT UNSIGNED NOT NULL,
  \`product_id\` INT UNSIGNED NOT NULL,
  \`color_id\` INT UNSIGNED NULL,
  \`size\` SMALLINT UNSIGNED NULL,
  \`exchanged_product_id\` INT UNSIGNED NULL,
  PRIMARY KEY (\`sale_id\`),
  INDEX \`fk_sales_product_sizes1_idx\` (\`size\` ASC, \`product_id\` ASC) VISIBLE,
  INDEX \`fk_sales_seller_countries1_idx\` (\`country\` ASC, \`seller_id\` ASC) VISIBLE,
  INDEX \`fk_sales_seller_products1_idx\` (\`seller_id\` ASC, \`product_id\` ASC) VISIBLE,
  INDEX \`fk_sales_product_countries1_idx\` (\`country\` ASC, \`product_id\` ASC) VISIBLE,
  INDEX \`fk_sales_product_colors1_idx\` (\`color_id\` ASC, \`product_id\` ASC) VISIBLE,
  INDEX \`fk_sales_seller_products2_idx\` (\`seller_id\` ASC, \`exchanged_product_id\` ASC) VISIBLE,
  INDEX \`product_id_idx\` (\`product_id\` ASC) VISIBLE,
  UNIQUE INDEX \`product_id__size__color_id-UNIQUE\` (\`product_id\` ASC, \`color_id\` ASC, \`size\` ASC) VISIBLE,
  CONSTRAINT \`fk_sales_product_sizes1\`
    FOREIGN KEY (\`size\` , \`product_id\`)
    REFERENCES \`product_sizes\` (\`size\` , \`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_sales_seller_countries1\`
    FOREIGN KEY (\`country\` , \`seller_id\`)
    REFERENCES \`seller_countries\` (\`country\` , \`seller_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_sales_seller_products1\`
    FOREIGN KEY (\`seller_id\` , \`product_id\`)
    REFERENCES \`seller_products\` (\`seller_id\` , \`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_sales_product_countries1\`
    FOREIGN KEY (\`country\` , \`product_id\`)
    REFERENCES \`product_countries\` (\`country\` , \`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_sales_product_colors1\`
    FOREIGN KEY (\`color_id\` , \`product_id\`)
    REFERENCES \`product_colors\` (\`color_id\` , \`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_sales_seller_products2\`
    FOREIGN KEY (\`seller_id\` , \`exchanged_product_id\`)
    REFERENCES \`seller_products\` (\`seller_id\` , \`product_id\`)
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
  describe.each(['never', 'always', 'smart'] as const)('scalarPropertiesForRelations=%s', scalarPropertiesForRelations => {
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

        test.each(['entitySchema', 'decorators'] as const)('entityDefinition=%s', async entityDefinition => {
          orm.config.get('entityGenerator').entityDefinition = entityDefinition;

          const dump = await orm.entityGenerator.generate();
          expect(dump).toMatchSnapshot('dump');
        });
      });
    });
  });
});
