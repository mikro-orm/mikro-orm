import { MetadataStorage } from '@mikro-orm/core';

process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = '1';
process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI = '1';
process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH = '1';
process.env.MIKRO_ORM_CLI_TS_CONFIG_PATH = './tests/tsconfig.dummy.json';

vi.resetModules();
vi.restoreAllMocks();
MetadataStorage.clear();
