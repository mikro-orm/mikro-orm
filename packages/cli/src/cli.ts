#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('yargonaut')
  .style('blue')
  .style('yellow', 'required')
  .helpStyle('green')
  .errorsStyle('red');

import yargs from 'yargs';
import { CLIHelper } from './CLIHelper';

(async () => {
  const args = (await CLIHelper.configure()).parse(process.argv.slice(2)) as { _: string[] };

  if (args._.length === 0) {
    yargs.showHelp();
  }
})();
