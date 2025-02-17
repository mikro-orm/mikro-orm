import { MikroORM } from '@mikro-orm/mysql';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';

let orm: MikroORM;

const schemaName = 'odd_table_names_example:100%';
const schema = `CREATE SCHEMA IF NOT EXISTS \`odd identifier's_example's_second\` DEFAULT CHARACTER SET utf8mb4 ;
CREATE SCHEMA IF NOT EXISTS \`odd_table_names_example:100%\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ;

CREATE TABLE IF NOT EXISTS \`odd_table_names_example:100%\`.\`50% of stuff\` (
  \`+-20%\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`my@odd.column\` VARCHAR(45) NOT NULL,
  \`column with apostrophe in it's name\` VARCHAR(45) NOT NULL,
  \`column with backtick in it\`\`s name\` VARCHAR(45) NOT NULL,
  UNIQUE INDEX \`odd columns' unique index\` (\`column with apostrophe in it's name\` ASC, \`column with backtick in it\`\`s name\` ASC) VISIBLE,
  PRIMARY KEY (\`+-20%\`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`odd_table_names_example:100%\`.\`*misc\` (
  \`@ref\` INT UNSIGNED NOT NULL,
  \`type\` ENUM('application/svg+xml', 'image/png'),
  \`enum\` ENUM('a', 'b', 'a+b') DEFAULT 'a+b',
  PRIMARY KEY (\`@ref\`),
  CONSTRAINT \`fk_*misc_50% of stuff\`
    FOREIGN KEY (\`@ref\`)
    REFERENCES \`odd_table_names_example:100%\`.\`50% of stuff\` (\`+-20%\`))
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`odd identifier's_example's_second\`.\`table's name has apostrophe, also \`\` this\` (
  \`!cool\` INT UNSIGNED NOT NULL,
  \`'derive\` VARCHAR(45) NULL,
  \`__proto__\` VARCHAR(45) NULL,
  PRIMARY KEY (\`!cool\`),
  UNIQUE INDEX \`__proto___UNIQUE\` (\`__proto__\` ASC) VISIBLE,
  CONSTRAINT \`fk_table's name has apostrophe, also \`\` this_*misc\`
    FOREIGN KEY (\`!cool\`)
    REFERENCES \`odd_table_names_example:100%\`.\`*misc\` (\`@ref\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`odd_table_names_example:100%\`.\`this+that\` (
  \`80% of stuff\` INT UNSIGNED NOT NULL,
  PRIMARY KEY (\`80% of stuff\`),
  CONSTRAINT \`fk_this+that_*misc1\`
    FOREIGN KEY (\`80% of stuff\`)
    REFERENCES \`odd_table_names_example:100%\`.\`*misc\` (\`@ref\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8mb4
COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS \`odd_table_names_example:100%\`.\`ns___subns__the_name\` (
  \`id\` INT UNSIGNED NOT NULL,
  \`r_n_b\` VARCHAR(45) NOT NULL,
  \`*\` VARCHAR(45) NOT NULL,
  \`$*\` VARCHAR(35) NOT NULL,
  PRIMARY KEY (\`id\`)
)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`odd_table_names_example:100%\`.\`123_table_name\` (
  \`$\` INT NOT NULL,
  \`$$\` BIGINT NOT NULL,
  \`prototype\` VARCHAR(45) NOT NULL,
  \`oh_captain__my___captain\` VARCHAR(255) NOT NULL DEFAULT 'test',
  \`infer\` VARCHAR(255) NOT NULL,
  \`$infer\` VARCHAR(200) NOT NULL,
  \`$$infer\` VARCHAR(100) NOT NULL,
  PRIMARY KEY (\`$\`),
  INDEX \`fk_123_table_name_table's name has apostrophe, also\`\` this_idx\` (\`prototype\` ASC) VISIBLE,
  INDEX \`dollar's index\` (\`$$\` ASC, \`$infer\` ASC) VISIBLE,
  CONSTRAINT \`fk_123_table_name_table's name has apostrophe, also \`\` this1\`
    FOREIGN KEY (\`prototype\`)
    REFERENCES \`odd identifier's_example's_second\`.\`table's name has apostrophe, also \`\` this\` (\`__proto__\`)
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

  if (await orm.schema.ensureDatabase()) {
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
    const dump = await orm.entityGenerator.generate({
      save: true,
      path: './temp/entities-1',
    });
    expect(dump).toMatchSnapshot('mysql');
    expect(existsSync('./temp/entities-1/E123TableName.ts')).toBe(true);
    await rm('./temp/entities-1', { recursive: true, force: true });
  });
});
