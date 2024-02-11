import { MikroORM } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;
const schemaName = 'pivot_ref_examples';

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

test('RefToPivotTable', async () => {
  if (await orm.schema.ensureDatabase({ create: true })) {
    await orm.schema.execute(`
CREATE TABLE IF NOT EXISTS \`sender\` (
  \`sender_id\` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`sender_id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`emails\` (
  \`email_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`email\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`email_id\`),
  UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`sender_emails\` (
  \`sender_id\` SMALLINT UNSIGNED NOT NULL,
  \`email_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`sender_id\`, \`email_id\`),
  INDEX \`fk_sender_emails_emails1_idx\` (\`email_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_sender_emails_sender\`
    FOREIGN KEY (\`sender_id\`)
    REFERENCES \`sender\` (\`sender_id\`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT \`fk_sender_emails_emails1\`
    FOREIGN KEY (\`email_id\`)
    REFERENCES \`emails\` (\`email_id\`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`email_messages_log\` (
  \`log_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`sender_id\` SMALLINT UNSIGNED NOT NULL,
  \`sender_email_id\` INT UNSIGNED NOT NULL,
  \`recepient_email_id\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`log_id\`),
  INDEX \`fk_email_messages_log_sender_emails1_idx\` (\`sender_id\` ASC, \`sender_email_id\` ASC) VISIBLE,
  INDEX \`fk_email_messages_log_emails1_idx\` (\`recepient_email_id\` ASC) VISIBLE,
  CONSTRAINT \`fk_email_messages_log_sender_emails1\`
    FOREIGN KEY (\`sender_id\` , \`sender_email_id\`)
    REFERENCES \`sender_emails\` (\`sender_id\` , \`email_id\`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT \`fk_email_messages_log_emails1\`
    FOREIGN KEY (\`recepient_email_id\`)
    REFERENCES \`emails\` (\`email_id\`)
    ON DELETE CASCADE
    ON UPDATE CASCADE)
ENGINE = InnoDB;
  `);
  }
  const dump = await orm.entityGenerator.generate();
  expect(dump).toMatchSnapshot('mysql-entity-dump');
});
