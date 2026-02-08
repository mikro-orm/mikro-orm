import { MikroORM } from '@mikro-orm/mysql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schemaName = 'nullable_fk_example';
const schema = `
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
  `;

beforeAll(async () => {
  orm = new MikroORM({
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
