import {MikroORM} from '@mikro-orm/core';
import {config, useDocker} from './mikro-orm/config';
import {addSampleData} from './db';

(async () => {
  const orm = await MikroORM.init(config);

  if (process.argv.includes('--add-sample-data')) {
    console.log('Adding sample data...');
    await addSampleData({
      orm,
      wrap: useDocker,
      ...(useDocker && {dropDb: config.dbName}),
    });
  }
})();
