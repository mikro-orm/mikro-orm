import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { EntityGenerator } from '@mikro-orm/entity-generator';

const schema = `
CREATE TYPE db_row_status AS ENUM ('enabled', 'disabled', 'archived', 'deleted');

CREATE TABLE domains (
  key VARCHAR(64) PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  row_status db_row_status NOT NULL DEFAULT 'enabled'
);

CREATE TABLE roles (
  key VARCHAR(64) PRIMARY KEY,
  name VARCHAR(256) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  row_status db_row_status NOT NULL DEFAULT 'enabled'
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(256) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  row_status db_row_status NOT NULL DEFAULT 'enabled'
);

CREATE TABLE user_roles (
  PRIMARY KEY (domain_key, user_id),
  --
  domain_key VARCHAR(64) NOT NULL REFERENCES domains (key) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role_key VARCHAR(64) NOT NULL REFERENCES roles (key) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  row_status db_row_status NOT NULL DEFAULT 'enabled'
);
`;

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    metadataProvider: ReflectMetadataProvider,
    dbName: 'shared-native-enum',
    discovery: {
      warnWhenNoEntities: false,
    },
    ensureDatabase: false,
    extensions: [EntityGenerator],
  });

  if (await orm.schema.ensureDatabase({ create: false })) {
    await orm.schema.execute(schema);
  }
});

afterAll(async () => {
  await orm.close(true);
});

describe.each(['ts-enum', 'union-type', 'dictionary'] as const)('shared native enums [%s]', enumMode => {
  describe.each(['entitySchema', 'defineEntity', 'defineEntity+types', 'decorators'] as const)('[%s]', entityDefinition => {
    test('shared native enum', async () => {
      const dump = await orm.entityGenerator.generate({
        entityDefinition: entityDefinition === 'defineEntity+types' ? 'defineEntity' : entityDefinition,
        inferEntityType: entityDefinition === 'defineEntity+types',
        enumMode,
        bidirectionalRelations: true,
        identifiedReferences: true,
        scalarPropertiesForRelations: 'always',
        onlyPurePivotTables: false,
        outputPurePivotTables: true,
      });
      expect(dump).toMatchSnapshot();
    });
  });
});
