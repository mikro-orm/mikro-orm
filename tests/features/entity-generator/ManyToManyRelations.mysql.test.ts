import { MikroORM } from '@mikro-orm/mysql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schemaName = 'many_to_many_variants';
const schema = `
CREATE TABLE IF NOT EXISTS \`users\` (
  \`user_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`user_id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`flags\` (
  \`flag_id\` INT UNSIGNED NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`flag_id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`user_flags\` (
  \`user_id\` INT UNSIGNED NOT NULL,
  \`flag_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`user_id\`, \`flag_id\`),
  INDEX \`fk_user_flags_flags1_idx\` (\`flag_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_user_flags_users\`
    FOREIGN KEY (\`user_id\`)
    REFERENCES \`users\` (\`user_id\`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT \`fk_user_flags_flags1\`
    FOREIGN KEY (\`flag_id\`)
    REFERENCES \`flags\` (\`flag_id\`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`emails\` (
  \`email_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`address\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`email_id\`),
  UNIQUE INDEX \`address_UNIQUE\` (\`address\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`user_emails\` (
  \`user_id\` INT UNSIGNED NOT NULL,
  \`email_id\` INT UNSIGNED NOT NULL,
  \`is_verified\` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (\`user_id\`, \`email_id\`),
  INDEX \`fk_user_emails_emails1_idx\` (\`email_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_user_emails_users1\`
    FOREIGN KEY (\`user_id\`)
    REFERENCES \`users\` (\`user_id\`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT \`fk_user_emails_emails1\`
    FOREIGN KEY (\`email_id\`)
    REFERENCES \`emails\` (\`email_id\`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`user_email_avatars\` (
  \`user_id\` INT UNSIGNED NOT NULL,
  \`email_id\` INT UNSIGNED NOT NULL,
  \`avatar_url\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`user_id\`, \`email_id\`),
  INDEX \`fk_user_email_avatars_emails1_idx\` (\`email_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_user_email_avatars_users1\`
    FOREIGN KEY (\`user_id\`)
    REFERENCES \`users\` (\`user_id\`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT \`fk_user_email_avatars_emails1\`
    FOREIGN KEY (\`email_id\`)
    REFERENCES \`emails\` (\`email_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`orders\` (
  \`order_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`order_id\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`user_orders\` (
  \`user_id\` INT UNSIGNED NOT NULL,
  \`order_id\` INT UNSIGNED NOT NULL,
  \`priority\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (\`user_id\`, \`order_id\`),
  UNIQUE INDEX \`priority_UNIQUE\` (\`priority\` ASC) VISIBLE,
  INDEX \`fk_user_orders_orders1_idx\` (\`order_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_user_orders_users1\`
    FOREIGN KEY (\`user_id\`)
    REFERENCES \`users\` (\`user_id\`)
    ON DELETE NO ACTION
    ON UPDATE RESTRICT,
  CONSTRAINT \`fk_user_orders_orders1\`
    FOREIGN KEY (\`order_id\`)
    REFERENCES \`orders\` (\`order_id\`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`completed_orders\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`user_id\` INT UNSIGNED NOT NULL,
  \`order_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`fk_completed_orders_users1_idx\` (\`user_id\` ASC) VISIBLE,
  INDEX \`fk_completed_orders_orders1_idx\` (\`order_id\` ASC) VISIBLE,
  UNIQUE INDEX \`user_id__order_id_unique\` (\`user_id\` ASC, \`order_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_completed_orders_users1\`
    FOREIGN KEY (\`user_id\`)
    REFERENCES \`users\` (\`user_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_completed_orders_orders1\`
    FOREIGN KEY (\`order_id\`)
    REFERENCES \`orders\` (\`order_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`user_email_orders\` (
  \`user_id\` INT UNSIGNED NOT NULL,
  \`email_id\` INT UNSIGNED NOT NULL,
  \`order_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`user_id\`, \`email_id\`),
  INDEX \`fk_user_email_orders_emails1_idx\` (\`email_id\` ASC) VISIBLE,
  INDEX \`fk_user_email_orders_orders1_idx\` (\`order_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_user_email_orders_users1\`
    FOREIGN KEY (\`user_id\`)
    REFERENCES \`users\` (\`user_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_user_email_orders_emails1\`
    FOREIGN KEY (\`email_id\`)
    REFERENCES \`emails\` (\`email_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_user_email_orders_orders1\`
    FOREIGN KEY (\`order_id\`)
    REFERENCES \`orders\` (\`order_id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`user_email_flags\`
(
  \`user_id\`  INT UNSIGNED NOT NULL,
  \`email_id\` INT UNSIGNED NOT NULL,
  \`flag_id\`  INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (\`user_id\`, \`email_id\`),
  INDEX \`fk_user_email_flags_emails1_idx\` (\`email_id\` ASC) VISIBLE,
  INDEX \`fk_user_email_flags_flags1_idx\` (\`flag_id\` ASC) VISIBLE,
  UNIQUE INDEX \`flag_id_UNIQUE\` (\`flag_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_user_email_flags_users1\`
    FOREIGN KEY (\`user_id\`)
      REFERENCES \`users\` (\`user_id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
  CONSTRAINT \`fk_user_email_flags_emails1\`
    FOREIGN KEY (\`email_id\`)
      REFERENCES \`emails\` (\`email_id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
  CONSTRAINT \`fk_user_email_flags_flags1\`
    FOREIGN KEY (\`flag_id\`)
      REFERENCES \`flags\` (\`flag_id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
)
  ENGINE = InnoDB;
  `;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: schemaName,
    port: 3308,
    discovery: { warnWhenNoEntities: false },
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
  describe.each([true, false])('bidirectionalRelations=%s', bidirectionalRelations => {
    describe.each([true, false])('onlyPurePivotTables=%s', onlyPurePivotTables => {
      describe.each([true, false])('outputPurePivotTables=%s', outputPurePivotTables => {
        describe.each([true, false])('readOnlyPivotTables=%s', readOnlyPivotTables => {
          test.each(['entitySchema', 'decorators'] as const)('entityDefinition=%s', async entityDefinition => {
            const dump = await orm.entityGenerator.generate({
              bidirectionalRelations,
              onlyPurePivotTables,
              outputPurePivotTables,
              readOnlyPivotTables,
              entityDefinition,
            });
            expect(dump).toMatchSnapshot('dump');
          });
        });
      });
    });
  });
});
