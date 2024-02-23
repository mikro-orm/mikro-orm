import { EntityGenerator } from '@mikro-orm/entity-generator';
import { MikroORM, ReferenceKind } from '@mikro-orm/mysql';

let orm: MikroORM;

const schemaName = 'conflicting_entity_names_example';
const schema = `
CREATE TABLE IF NOT EXISTS \`entity\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`type\` ENUM('legal', 'physical') NOT NULL,
  PRIMARY KEY (\`id\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`enum\` (
  \`id\` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`opt\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`id\`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`property\` (
  \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`one_to_many\` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (\`id\`),
  INDEX \`fk_property_enum_idx\` (\`one_to_many\` ASC) VISIBLE,
  CONSTRAINT \`fk_property_enum\`
    FOREIGN KEY (\`one_to_many\`)
    REFERENCES \`enum\` (\`id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`config\` (
  \`id\` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  \`settings\` JSON NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`many_to_many\` (
  \`entity_id\` INT UNSIGNED NOT NULL,
  \`property_id\` INT UNSIGNED NOT NULL,
  \`creation_order\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`owner_since\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`entity_id\`, \`property_id\`),
  INDEX \`fk_many_to_many_property1_idx\` (\`property_id\` ASC) VISIBLE,
  UNIQUE INDEX \`creation_order_UNIQUE\` (\`creation_order\` ASC) VISIBLE,
  CONSTRAINT \`fk_many_to_many_entity1\`
    FOREIGN KEY (\`entity_id\`)
    REFERENCES \`entity\` (\`id\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT \`fk_many_to_many_property1\`
    FOREIGN KEY (\`property_id\`)
    REFERENCES \`property\` (\`id\`)
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

  test.each([true, false])('entitySchema=%s', async entitySchema => {
    orm.config.get('entityGenerator').entitySchema = entitySchema;
    orm.config.get('entityGenerator').bidirectionalRelations = true;
    orm.config.get('entityGenerator').readOnlyPivotTables = true;

    const dump = await orm.entityGenerator.generate(
      {
        onInitialMetadata: (metadata, platform) => {
          metadata[0].addProperty({
            type: 'MyUnknownClass',
            kind: ReferenceKind.EMBEDDED,
            name: 'test',
            fieldNames: ['test'],
            persist: false,
            hydrate: false,
          });
          metadata[0].addProperty({
            type: 'Entity',
            kind: ReferenceKind.EMBEDDED,
            name: 'test2',
            fieldNames: ['test2'],
            persist: false,
            hydrate: false,
          });
          metadata[0].addProperty({
            type: 'EntitySchema',
            kind: ReferenceKind.EMBEDDED,
            name: 'test3',
            fieldNames: ['test3'],
            persist: false,
            hydrate: false,
          });
        },
      },
    );
    expect(dump).toMatchSnapshot('dump');
  });

});
