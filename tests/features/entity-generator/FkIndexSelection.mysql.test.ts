import { MikroORM, MikroORMOptions } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';

let orm: MikroORM;

const schemaName = 'fk_index_selection_example';
const schema = `
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

        test.each(['entitySchema', 'decorators'] as const)('entityDefinition=%s', async entityDefinition => {
          orm.config.get('entityGenerator').entityDefinition = entityDefinition;

          const dump = await orm.entityGenerator.generate();
          expect(dump).toMatchSnapshot('dump');
        });
      });
    });
  });
});
