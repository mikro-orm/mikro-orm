import { MikroORM } from '@mikro-orm/postgresql';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';

let orm: MikroORM;

const dbName = 'odd_db_name100';
const schema = `CREATE SCHEMA IF NOT EXISTS "odd_identifier's_example's_second";
CREATE SCHEMA IF NOT EXISTS "odd table_names_example:100%";

SET search_path TO "odd table_names_example:100%";

CREATE TABLE IF NOT EXISTS "50% of stuff" (
  "+-20%" SERIAL PRIMARY KEY,
  "my@odd.column" VARCHAR(45) NOT NULL,
  "column with apostrophe in it's name" VARCHAR(45) NOT NULL,
  "column with backtick in it\`\`s name" VARCHAR(45) NOT NULL,
  CONSTRAINT "odd columns' unique index" UNIQUE ("column with apostrophe in it's name", "column with backtick in it\`\`s name")
);

CREATE TABLE IF NOT EXISTS "*misc" (
  "@ref" SERIAL PRIMARY KEY,
  CONSTRAINT "fk_*misc_50% of stuff"
    FOREIGN KEY ("@ref")
    REFERENCES "50% of stuff" ("+-20%")
);

CREATE TABLE IF NOT EXISTS "this+that" (
  "80 of stuff" SERIAL PRIMARY KEY,
  CONSTRAINT "fk_this+that_*misc1"
    FOREIGN KEY ("80 of stuff")
    REFERENCES "*misc" ("@ref")
);

CREATE TABLE IF NOT EXISTS "odd_identifier's_example's_second"."ns___subns__the_name" (
  "id" SERIAL PRIMARY KEY,
  "r_n_b" VARCHAR(45) NOT NULL,
  "*" VARCHAR(45) NOT NULL,
  "$*" VARCHAR(35) NOT NULL
);

CREATE TABLE IF NOT EXISTS "odd_identifier's_example's_second"."table's name has apostrophe, Also \`\` this" (
  "!cool" SERIAL PRIMARY KEY,
  "'derive" VARCHAR(45),
  "__proto__" VARCHAR(45),
  CONSTRAINT "proto_unique" UNIQUE ("__proto__"),
  CONSTRAINT "fk_table's name has apostrophe, Also \`\` this_*misc"
    FOREIGN KEY ("!cool")
    REFERENCES "odd table_names_example:100%"."*misc" ("@ref")
);

CREATE TABLE IF NOT EXISTS "odd table_names_example:100%"."123_table_name" (
  "$" INT NOT NULL,
  "prototype" VARCHAR(45) NOT NULL,
  "oh_captain__my___captain" VARCHAR(255) NOT NULL DEFAULT 'test',
  "infer" VARCHAR(255) NOT NULL,
  "$infer" VARCHAR(200) NOT NULL,
  "$$infer" VARCHAR(200) NOT NULL,
  PRIMARY KEY ("$"),
  CONSTRAINT "fk_123_table_name_table's name has apostrophe, Also \`\` this1"
    FOREIGN KEY ("prototype")
    REFERENCES "odd_identifier's_example's_second"."table's name has apostrophe, Also \`\` this" ("__proto__")
);`;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName,
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
    dbName,
    discovery: { warnWhenNoEntities: false },
    extensions: [EntityGenerator],
    multipleStatements: true,
  });
});

afterEach(async () => {
  await orm.close(true);
});

describe(dbName, () => {
  test.each([true, false])('entitySchema=%s', async entitySchema => {
    orm.config.get('entityGenerator').entitySchema = entitySchema;
    const dump = await orm.entityGenerator.generate({
      save: true,
      path: './temp/entities-2',
    });
    expect(dump).toMatchSnapshot('postgre');
    expect(existsSync('./temp/entities-2/E123TableName.ts')).toBe(true);
    await rm('./temp/entities-2', { recursive: true, force: true });
  });
});
