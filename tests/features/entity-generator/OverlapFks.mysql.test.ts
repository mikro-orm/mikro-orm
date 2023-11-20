import { MikroORM, MikroORMOptions } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schemaName = 'overlap_fk_example';
const schema = `
CREATE TABLE IF NOT EXISTS \`sellers\` (
  \`seller_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`seller_id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`products\` (
  \`product_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  \`current_price\` DECIMAL(10,2) NOT NULL,
  \`current_quantity\` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (\`product_id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`product_sellers\` (
  \`seller_id\` INT UNSIGNED NOT NULL,
  \`product_id\` INT UNSIGNED NOT NULL,
  \`is_currently_allowed\` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (\`seller_id\`, \`product_id\`),
  CONSTRAINT \`fk_product_sellers_sellers\`
    FOREIGN KEY (\`seller_id\`)
    REFERENCES \`sellers\` (\`seller_id\`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT \`fk_product_sellers_products1\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`products\` (\`product_id\`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`countries\` (
  \`code\` CHAR(2) NOT NULL,
  PRIMARY KEY (\`code\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`product_country_map\` (
  \`country\` CHAR(2) NOT NULL,
  \`product_id\` INT UNSIGNED NOT NULL,
  \`is_currently_allowed\` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (\`country\`, \`product_id\`),
  CONSTRAINT \`fk_product_country_map_products1\`
    FOREIGN KEY (\`product_id\`)
    REFERENCES \`products\` (\`product_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_product_country_map_countries1\`
    FOREIGN KEY (\`country\`)
    REFERENCES \`countries\` (\`code\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`sales\` (
  \`sale_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`country\` CHAR(2) NOT NULL,
  \`seller_id\` INT UNSIGNED NOT NULL,
  \`product_id\` INT UNSIGNED NOT NULL,
  \`singular_price\` DECIMAL(10,2) NOT NULL,
  \`quantity_sold\` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (\`sale_id\`),
  INDEX \`fk_sales_product_sellers1_idx\` (\`seller_id\` ASC, \`product_id\` ASC) VISIBLE,
  INDEX \`fk_sales_product_country_map1_idx\` (\`country\` ASC, \`product_id\` ASC) VISIBLE,
  INDEX \`product_id_idx\` (\`product_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_sales_product_sellers1\`
    FOREIGN KEY (\`seller_id\` , \`product_id\`)
    REFERENCES \`product_sellers\` (\`seller_id\` , \`product_id\`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT \`fk_sales_product_country_map1\`
    FOREIGN KEY (\`country\` , \`product_id\`)
    REFERENCES \`product_country_map\` (\`country\` , \`product_id\`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
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
  await orm.schema.ensureDatabase();
  await orm.schema.execute(schema);
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

afterAll(async () => {
  orm = await MikroORM.init({
    dbName: schemaName,
    port: 3308,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
    multipleStatements: true,
  });
  await orm.schema.dropDatabase();
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
