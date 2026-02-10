import { MikroORM } from '@mikro-orm/mysql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { rm } from 'node:fs/promises';

let orm: MikroORM;

const schemaName = 'complex_pks_example';
const schema = `

CREATE TABLE IF NOT EXISTS \`worktime\` (
  \`weekday\` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  \`from\` TIME NOT NULL,
  \`to\` TIME NOT NULL,
  PRIMARY KEY (\`weekday\`))
ENGINE = InnoDB
COMMENT = 'Worktime. If a day is holiday, remove the row.';

CREATE TABLE IF NOT EXISTS \`events\` (
  \`weekday\` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  \`at\` TIME NOT NULL,
  \`what\` VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`weekday\`, \`at\`),
  CONSTRAINT \`fk_events_worktime\`
    FOREIGN KEY (\`weekday\`)
    REFERENCES \`worktime\` (\`weekday\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS \`event_details\` (
  \`weekday\` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  \`at\` TIME NOT NULL,
  \`more_info\` TEXT NULL,
  PRIMARY KEY (\`weekday\`, \`at\`),
  CONSTRAINT \`fk_event_details_events1\`
    FOREIGN KEY (\`weekday\` , \`at\`)
    REFERENCES \`events\` (\`weekday\` , \`at\`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
`;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
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
});

afterAll(async () => {
  await orm.close(true);
});

describe(schemaName, () => {
  test.each(['decorators', 'entitySchema'] as const)('%s', async entityDefinition => {
    const dump = await orm.entityGenerator.generate({
      entityDefinition,
      save: true,
      path: './temp/entities-oddPkTypes',
    });
    expect(dump).toMatchSnapshot('mysql');
    await rm('./temp/entities-oddPkTypes', { recursive: true, force: true });
  });
});
