import { MetadataStorage } from '@mikro-orm/core';

process.env.MIKRO_ORM_ALLOW_GLOBAL_CONTEXT = '1';
process.env.MIKRO_ORM_ALLOW_GLOBAL_CLI = '1';
process.env.MIKRO_ORM_ALLOW_VERSION_MISMATCH = '1';

jest.restoreAllMocks();
MetadataStorage.clear();
