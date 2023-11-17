import { MikroORM, MikroORMOptions } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

afterEach(async () => {
  await orm.schema.dropDatabase();
  await orm.close(true);
});

const schemas = {
  overlap_fk_example:  `
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
  `,
  nullable_fk_example: `
CREATE TABLE IF NOT EXISTS \`emails\` (
  \`email_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`address\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`email_id\`),
  UNIQUE INDEX \`address_UNIQUE\` (\`address\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`senders\` (
  \`sender_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`sender_id\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`recepients\` (
  \`recepient_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`recepient_id\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`sender_emails\` (
  \`sender_id\` INT UNSIGNED NOT NULL,
  \`email_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`sender_id\`, \`email_id\`),
  INDEX \`fk_sender_emails_emails1_idx\` (\`email_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_sender_emails_senders\`
    FOREIGN KEY (\`sender_id\`)
    REFERENCES \`senders\` (\`sender_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_sender_emails_emails1\`
    FOREIGN KEY (\`email_id\`)
    REFERENCES \`emails\` (\`email_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`recepient_emails\` (
  \`recepient_id\` INT UNSIGNED NOT NULL,
  \`email_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`recepient_id\`, \`email_id\`),
  INDEX \`fk_recepient_emails_emails1_idx\` (\`email_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_recepient_emails_recepients1\`
    FOREIGN KEY (\`recepient_id\`)
    REFERENCES \`recepients\` (\`recepient_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_recepient_emails_emails1\`
    FOREIGN KEY (\`email_id\`)
    REFERENCES \`emails\` (\`email_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`email_sending_logs\` (
  \`log_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`sender_id\` INT UNSIGNED NOT NULL,
  \`recepient_id\` INT UNSIGNED NOT NULL,
  \`sender_email_id\` INT UNSIGNED NOT NULL,
  \`recepient_email_id\` INT UNSIGNED NOT NULL,
  \`reply_email_id\` INT UNSIGNED NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`log_id\`),
  INDEX \`fk_email_sending_logs_sender_emails1_idx\` (\`sender_id\` ASC, \`sender_email_id\` ASC) VISIBLE,
  INDEX \`fk_email_sending_logs_recepient_emails1_idx\` (\`recepient_id\` ASC, \`recepient_email_id\` ASC) VISIBLE,
  INDEX \`fk_email_sending_logs_sender_emails2_idx\` (\`sender_id\` ASC, \`reply_email_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_email_sending_logs_sender_emails1\`
    FOREIGN KEY (\`sender_id\` , \`sender_email_id\`)
    REFERENCES \`sender_emails\` (\`sender_id\` , \`email_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_email_sending_logs_recepient_emails1\`
    FOREIGN KEY (\`recepient_id\` , \`recepient_email_id\`)
    REFERENCES \`recepient_emails\` (\`recepient_id\` , \`email_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_email_sending_logs_sender_emails2\`
    FOREIGN KEY (\`sender_id\` , \`reply_email_id\`)
    REFERENCES \`sender_emails\` (\`sender_id\` , \`email_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
  `,
  ambiguous_fk_example: `
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
  `,
  non_composite_ambiguous_fk_example: `
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
  `,
  fk_index_selection_example: `
CREATE TABLE IF NOT EXISTS \`cars\` (
  \`car_brand\` VARCHAR(255) NOT NULL,
  \`car_year\` YEAR NOT NULL,
  PRIMARY KEY (\`car_brand\`, \`car_year\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`fashionable_colors\` (
  \`year\` YEAR NOT NULL,
  \`color\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`year\`, \`color\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`users\` (
  \`user_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`favorite_car_brand\` VARCHAR(255) NULL,
  \`favorite_car_year\` YEAR NULL,
  \`favorite_color\` VARCHAR(255) NULL,
  \`favorite_book\` VARCHAR(255) NULL,
  PRIMARY KEY (\`user_id\`),
  INDEX \`fk_users_cars_idx\` (\`favorite_car_brand\` ASC, \`favorite_car_year\` ASC) INVISIBLE,
  UNIQUE INDEX \`when_set_unique\` (\`favorite_car_brand\` ASC, \`favorite_car_year\` ASC, \`favorite_color\` ASC) INVISIBLE,
  INDEX \`fk_users_fashionable_colors1_idx\` (\`favorite_car_year\` ASC, \`favorite_color\` ASC) INVISIBLE,
  INDEX \`favorites_idx\` (\`favorite_car_year\` ASC, \`favorite_color\` ASC, \`favorite_book\` ASC) VISIBLE,
  CONSTRAINT \`fk_users_cars\`
    FOREIGN KEY (\`favorite_car_brand\` , \`favorite_car_year\`)
    REFERENCES \`cars\` (\`car_brand\` , \`car_year\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_users_fashionable_colors1\`
    FOREIGN KEY (\`favorite_car_year\` , \`favorite_color\`)
    REFERENCES \`fashionable_colors\` (\`year\` , \`color\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
`,
  fk_shared_with_column_example: `
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
`,
} as const;

describe('4898', () => {

  describe.each(Object.keys(schemas))('%s', i => {
    const schemaName = i as keyof typeof schemas;

    beforeEach(async () => {
      orm = await MikroORM.init({
        dbName: schemaName,
        port: 3308,
        discovery: { warnWhenNoEntities: false },
        extensions: [EntityGenerator],
        multipleStatements: true,
      });
      await orm.schema.ensureDatabase();
    });

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

            await orm.schema.execute(schemas[schemaName]);
            const dump = await orm.entityGenerator.generate();
            expect(dump).toMatchSnapshot('dump');
          });
        });
      });
    });
  });
});
